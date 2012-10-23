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
            
    def get_pos(self, id, srid=4326):
        query = 'SELECT ST_AsGeoJSON(ST_Transform(ST_Centroid(the_geom), %s)) FROM '+self.layer+ ' WHERE pid=%s'
        self.cursor.execute(query,(srid,id))
        res = self.cursor.fetchone()
        return res[0]
        
    def find_in_rect(self, N, E, S, W, srid):
        c0 = '%f %f'%(W,N)
        c1 = '%f %f'%(E,N)
        c2 = '%f %f'%(E,S)
        c3 = '%f %f'%(W,S)
        polygon = 'POLYGON(('+ ','.join([c0,c1,c2,c3,c0]) +'))'
        st_polygon = "ST_GeomFromText('" + polygon + "', "+ str(srid) +")"
        query = 'SELECT pid FROM %s WHERE ST_Contains(ST_Transform(%s,ST_SRID(%s)), %s)'%(self.layer, st_polygon, self.geometry_col, self.geometry_col)
        #print('[RECT] %s'%query)
        self.cursor.execute(query)
        ret = []
        for row in self.cursor.fetchall():
            ret.append(row[0])
        return json.dumps(ret)
            
        
        
        
        