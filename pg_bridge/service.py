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
        
class JSONResponse(Response):
    def __init__(self):
        super(JSONResponse, self).__init__()
        self.headerlist = [('Content-type', 'application/json')]
        
class Handler(object):
    def __init__(self, bridge):
        self.bridge = bridge
        
    def all(self, req, response):
        data = self.bridge.get_all()
        response.body = data
        
    def rect(self, req, response):
        data = self.bridge.find_in_rect(req.params.get('N'),
                                        req.params.get('E'),
                                        req.params.get('S'),
                                        req.params.get('W'))
        response.body = data
        
    def pos(self, req, response):
        comps = req.path[1:].split('/')
        id = comps[1]
        response.body = self.bridge.get_pos(id)

class ServiceApp(object):
    def __init__(self):
        args = {'host':settings.PG_HOST,
                'user':settings.PG_USER,
                'password':settings.PG_PASSWORD,
                'database':settings.PG_DATABASE}
        self.handler = Handler(pgbridge.PGBMABridge(settings.LAYER, args))
        
    def __call__(self, environ, start_response):
        req = Request(environ)
        path = req.path[1:]
        print('[REQUESTED PATH] %s => %s'%(req.path,path.split('/')))
        self.components = path.split('/')
        method_name = self.components[0]
        try:
            method = getattr(self.handler, method_name)
            self.response = JSONResponse()
            method(req, self.response)
            return self.response(environ, start_response)
        except Exception, e:
            etype, value, tb = sys.exc_info()
            print('%s : %s'%(etype.__name__, value))
            tb_fmt = traceback.format_tb(tb)
            for t in tb_fmt:
                print(t)
            return Error404()(environ, start_response)
        