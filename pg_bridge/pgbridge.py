"""
PostGIS bridge
"""

import psycopg2
import json

class PGBMABridge(object):
    def __init__(self, layer, conn_args):
        self.layer = layer
        self.connect(conn_args)
        
        
    def connect(self, conn_args):
        self.conn = psycopg2.connect(host=conn_args['host'],
                                    user=conn_args['user'],
                                    database=conn_args['database'],
                                    password=conn_args['password'],
                                    )
        self.cursor = self.conn.cursor()
        self.cursor.execute("SELECT column_name, udt_name FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name=%s",(self.layer,));
        res = self.cursor.fetchall()
        self.cnames = []
        self.geometry_col = None
        for r in res:
            if r[1] == 'geometry':
                self.geometry_col = r[0]
            else:
                self.cnames.append(r[0])
        
    def get_all(self):
        query = ' '.join(['SELECT',','.join(self.cnames),'FROM',self.layer,';'])
        self.cursor.execute(query)
        rows = self.cursor.fetchall()
        ret = []
        for row in rows:
            dr = {}
            for c in range(len(self.cnames)):
                dr[self.cnames[c]] = row[c]
            ret.append(dr)
        return json.dumps(ret)
            
    def get_pos(self, id):
        pass
        
    def find_in_rect(self, N, E, S, W):
        c0 = '%f %f'%(N,W)
        c1 = '%f %f'%(N,E)
        c2 = '%f %f'%(S,E)
        c3 = '%f %f'%(S,W)
        polygon = 'POLYGON(('+ ','.join([c0,c1,c2,c3]) +'))'
        st_polygon = "ST_GeomFromText('" + polygon + "')"
        self.cursor.execute('SELECT id WHERE ST_Contains(%s, %s)'%(st_polygon, self.geometry_col))
        ret = []
        for row in self.cursor.fetchall():
            ret.append(row[0])
        return json.dumps(ret)
            
        
        
        
        