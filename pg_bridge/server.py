"""
server
"""

import sys
import os
import argparse

from gevent import wsgi



#sys.dont_write_bytecode = True
rootpath = os.path.dirname(__file__)
dirs = ['']

for d in dirs:
    path = rootpath + d
    if path not in sys.path:
        sys.path.append(path)


from service import ServiceApp

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-a', "--address", help="Address to bind to", default='')
    parser.add_argument('-p', "--port", help="Port to listen to", default=8001, type=int)
    parser.add_argument('-l', "--log", help="gevent logging", default=None)
    parser.add_argument('-f', "--fork", help="Set it to make the process go bg", action='store_true')
    args = parser.parse_args()
    
    pid = os.getpid()
    app = ServiceApp()
    app_server = wsgi.WSGIServer((args.address, args.port), application=app, log=args.log)
    print('PARENT PID: %s'%pid)
    if args.fork:
        print('Forking')
        try:
            pid = os.fork()
            print('CHILD PID: %s'%pid)
        except OSError as e:
            print('Failed to fork: %s'%e)
    if args.fork:
        if pid == 0:
            os.setsid()
            app_server.serve_forever()
    else:
        try:
            app_server.serve_forever()
        except KeyboardInterrupt:
            print('Stopping service')
            app_server.kill()
    
    
if __name__ == '__main__':
    main()