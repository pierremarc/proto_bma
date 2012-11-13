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
    
    def exec_query(self, query, args=None):
        try:
            if args:
                self.cursor.execute(query, args)
            else:
                self.cursor.execute(query)
        except Exception:
            self.conn.rollback()
        else:
            self.conn.commit()
        
    def get_all(self, srid=4326, geo_json=False):
        query = ' '.join(['SELECT',','.join(self.cnames),', ST_AsBinary(ST_Transform(the_geom, \'%s\')) as geom'%(srid,),'FROM',self.layer,';'])
        self.exec_query(query)
        rows = self.cursor.fetchall()
        ret = []
        geomidx = len(self.cnames)
        for row in rows:
            dr = {}
            for c in range(len(self.cnames)):
                dr[self.cnames[c]] = row[c]
            dr['geom'] = row[geomidx]
            ret.append(dr)
        return json.dumps(ret)
            
    def get_pos(self, id, srid=4326):
        query = 'SELECT ST_AsGeoJSON(ST_Transform(ST_Centroid(the_geom), %s)) FROM '+self.layer+ ' WHERE pid=%s'
        self.exec_query(query,(srid,id))
        res = self.cursor.fetchone()
        return res[0]
        
    def find_in_rect(self, N, E, S, W, srid):
        c0 = '%f %f'%(W,N)
        c1 = '%f %f'%(E,N)
        c2 = '%f %f'%(E,S)
        c3 = '%f %f'%(W,S)
        polygon = 'POLYGON(('+ ','.join([c0,c1,c2,c3,c0]) +'))'
        st_polygon = "ST_GeomFromText('" + polygon + "', "+ str(srid) +")"
        query = 'SELECT pid FROM %s WHERE ST_Intersects(ST_Transform(%s,ST_SRID(%s)), %s)'%(self.layer, st_polygon, self.geometry_col, self.geometry_col)
        #print('[RECT] %s'%query)
        self.exec_query(query)
        ret = []
        for row in self.cursor.fetchall():
            ret.append(row[0])
        return json.dumps(ret)
        
    def at_pos(self, lng, lat, srid=4326):
        #st_point = "ST_PointFromText('POINT(%f %f)', %s)"%(lng,lat,srid)
        st_point = "ST_PointFromText('POINT({lng:.16f} {lat:.16f})', {srid})".format(lng=lng, lat=lat, srid=srid)
        #query = 'SELECT pid FROM %s WHERE ST_Contains(%s, ST_Transform(%s,ST_SRID(%s)))'%(self.layer, self.geometry_col, st_point, self.geometry_col)
        query = 'SELECT pid FROM {layer} WHERE ST_Contains({geom}, ST_Transform({point},ST_SRID({geom})))'.format(layer=self.layer,geom=self.geometry_col,point=st_point)   
        print('[at_pos] %f %f %d => %s'%(lng, lat, srid, query))
        self.exec_query(query)
        res = self.cursor.fetchone()
        return json.dumps(res)
        
        
        
        