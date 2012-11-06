"""
pgbridge web service
"""
import traceback
import sys

from webob import Request, Response
import pgbridge
import settings

class Error404(Response):
    def __init__(self):
        super(Error404, self).__init__()
        self.status = 404
        
def get_components_from_request(req):
    path = req.path[1:]
    components = path.split('/')
    ret = []
    for cpm in components:
        if cpm:
            ret.append(cpm)
    return ret
        
class JSONResponse(Response):
    def __init__(self, origin):
        super(JSONResponse, self).__init__()
        self.headerlist = [('Content-type', 'application/json'), ('Access-Control-Allow-Origin', origin)]
        
class Handler(object):
    def __init__(self, bridge):
        self.bridge = bridge
        
    def all(self, req, response):
        data = self.bridge.get_all(int(req.params.get('srid')))
        response.body = data
        
    def rect(self, req, response):
        data = self.bridge.find_in_rect(float(req.params.get('N')),
                                        float(req.params.get('E')),
                                        float(req.params.get('S')),
                                        float(req.params.get('W')),
                                        int(req.params.get('srid')))
        response.body = data
        
    def pos(self, req, response):
        comps = get_components_from_request(req)
        id = comps[1]
        response.body = self.bridge.get_pos(id)
        
    def feature(self, req, response):
        data = self.bridge.at_pos(float(req.params.get('lng')), 
                                    float(req.params.get('lat')), 
                                    int(req.params.get('srid')))
        response.body = data

class ServiceApp(object):
    def __init__(self):
        args = {'host':settings.PG_HOST,
                'user':settings.PG_USER,
                'password':settings.PG_PASSWORD,
                'database':settings.PG_DATABASE}
        self.handler = Handler(pgbridge.PGBMABridge(settings.LAYER, args))
        
    def __call__(self, environ, start_response):
        req = Request(environ)
        self.components = get_components_from_request(req)
        print('[REQUESTED PATH] %s => %s'%(req.path,self.components))
        
        method_name = self.components[0]
        try:
            method = getattr(self.handler, method_name)
            origin = '*'
            if req.headers.has_key('Origin'):
                origin = req.headers['Origin']
            self.response = JSONResponse(origin)
            method(req, self.response)
            return self.response(environ, start_response)
        except Exception, e:
            etype, value, tb = sys.exc_info()
            print('%s : %s'%(etype.__name__, value))
            tb_fmt = traceback.format_tb(tb)
            for t in tb_fmt:
                print(t)
            return Error404()(environ, start_response)
        