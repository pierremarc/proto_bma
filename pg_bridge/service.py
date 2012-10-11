"""
pgbridge web service
"""


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
            return Error404()(environ, start_response)
        