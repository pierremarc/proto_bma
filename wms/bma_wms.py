#
# This file is part of Mapnik (c++ mapping toolkit)
#
# Copyright (C) 2006 Jean-Francois Doyon
#
# Mapnik is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
#
# $Id: wsgi.py 2326 2010-11-08 23:18:08Z dane $

"""WSGI application wrapper for Mapnik OGC WMS Server."""

import sys
import os

sys.dont_write_bytecode = True
rootpath = os.path.dirname(__file__)
dirs = ['', 'cascadenik']

for d in dirs:
    path = rootpath + d
    if path not in sys.path:
        sys.path.append(path)
        

try:
    from urlparse import parse_qs
except ImportError:
    from cgi import parse_qs

import logging
import imp

from cStringIO import StringIO

import mapnik
import ConfigParser

import ogcserver
from ogcserver.common import Version
from ogcserver.WMS import BaseWMSFactory, extract_named_rules
from ogcserver.configparser import SafeConfigParser
from ogcserver.wms111 import ExceptionHandler as ExceptionHandler111
from ogcserver.wms130 import ExceptionHandler as ExceptionHandler130
from ogcserver.exceptions import OGCException, ServerConfigurationError


#import cascadenik


ROOT_DIR = os.path.dirname(__file__)

SHAPEFILE = '/home/pierre/Documents/GSHHS_shp/WDBII_shp/f/WDBII_border_f_L1.shp'
PROJ4_STRING = '+init=epsg:900913'
MAPNIK_STYLE = ''


# Switch to these settings to use data in mercator projection from: http://tile.openstreetmap.org/world_boundaries-spherical.tgz 
#PROJ4_STRING = '+init=epsg:3395'
#SHAPEFILE = '/Users/spring/projects/mapnik-utils/trunk/sample_data/world_boundaries_m'

# Example query string for reprojected data:
# http://localhost/cgi-bin/mapnikwms.py?LAYERS=world&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&FORMAT=image%2Fpng&SRS=EPSG%3A3395&BBOX=-20037400.000000,-19929239.110000,%2020037400.000000,18375854.709643&WIDTH=256&HEIGHT=256

class WMSFactory(BaseWMSFactory):
    def __init__(self):
        print('Init WMSFactory')
        BaseWMSFactory.__init__(self)
        fp = '/'.join([ROOT_DIR, 'style.xml'])
        #fp = '/home/pierre/Documents/osm.mapnik/nadine_a_velo.xml'
        try:
            print('About to load XML file: %s'%(fp,))
            self.myloadXML(fp)
        except Exception as e:
            print('ERROR loading XML[%s]: %s'%(fp,e))
            return
            
    def myloadXML(self, xmlfile, strict=False):
        config = ConfigParser.SafeConfigParser()
        map_wms_srs = None
        if self.configpath:
            config.readfp(open(self.configpath))

            if config.has_option('map', 'wms_srs'):
                map_wms_srs = config.get('map', 'wms_srs')

        tmp_map = mapnik.Map(0,0)
        xml_f = open(xmlfile, 'rb')
        xml_str = xml_f.read()
        xml_f.close()
        mapnik.load_map_from_string(tmp_map, xml_str, strict)
        # parse map level attributes
        if tmp_map.background:
            self.map_attributes['bgcolor'] = tmp_map.background
        if tmp_map.buffer_size:
            self.map_attributes['buffer_size'] = tmp_map.buffer_size
        for lyr in tmp_map.layers:
            layer_section = 'layer_%s' % lyr.name
            layer_wms_srs = None
            if config.has_option(layer_section, 'wms_srs'):
                layer_wms_srs = config.get(layer_section, 'wms_srs')
            else:
                layer_wms_srs = map_wms_srs

            style_count = len(lyr.styles)
            if style_count == 0:
                raise ServerConfigurationError("Cannot register Layer '%s' without a style" % lyr.name)
            elif style_count == 1:
                style_obj = tmp_map.find_style(lyr.styles[0])
                style_name = lyr.styles[0]
        
                meta_s = extract_named_rules(style_obj)
                if meta_s:
                    self.meta_styles['%s_meta' % lyr.name] = meta_s
                    if hasattr(lyr,'abstract'):
                        name_ = lyr.abstract
                    else:
                        name_ = lyr.name
                    meta_layer_name = '%s:%s' % (name_,'-'.join(meta_s.names))
                    meta_layer_name = meta_layer_name.replace(' ','_')
                    self.meta_styles[meta_layer_name] = meta_s
                    meta_lyr = ogcserver.common.copy_layer(lyr)
                    meta_lyr.meta_style = meta_layer_name
                    meta_lyr.name = meta_layer_name
                    meta_lyr.wmsextrastyles = ()
                    meta_lyr.defaultstyle = meta_layer_name
                    meta_lyr.wms_srs = layer_wms_srs
                    self.ordered_layers.append(meta_lyr)
                    self.meta_layers[meta_layer_name] = meta_lyr
                    print meta_layer_name

                if style_name not in self.aggregatestyles.keys() and style_name not in self.styles.keys():
                    self.register_style(style_name, style_obj)

                # must copy layer here otherwise we'll segfault
                lyr_ = ogcserver.common.copy_layer(lyr)
                lyr_.wms_srs = layer_wms_srs
                self.register_layer(lyr_, style_name, extrastyles=(style_name,))

            elif style_count > 1:
                for style_name in lyr.styles:
                    style_obj = tmp_map.find_style(style_name)
                    
                    meta_s = extract_named_rules(style_obj)
                    if meta_s:
                        self.meta_styles['%s_meta' % lyr.name] = meta_s
                        if hasattr(lyr,'abstract'):
                            name_ = lyr.abstract
                        else:
                            name_ = lyr.name
                        meta_layer_name = '%s:%s' % (name_,'-'.join(meta_s.names))
                        meta_layer_name = meta_layer_name.replace(' ','_')
                        self.meta_styles[meta_layer_name] = meta_s
                        meta_lyr = ogcserver.common.copy_layer(lyr)
                        meta_lyr.meta_style = meta_layer_name
                        print meta_layer_name
                        meta_lyr.name = meta_layer_name
                        meta_lyr.wmsextrastyles = ()
                        meta_lyr.defaultstyle = meta_layer_name
                        meta_lyr.wms_srs = layer_wms_srs
                        self.ordered_layers.append(meta_lyr)
                        self.meta_layers[meta_layer_name] = meta_lyr
                    
                    if style_name not in self.aggregatestyles.keys() and style_name not in self.styles.keys():
                        self.register_style(style_name, style_obj)
                aggregates = tuple([sty for sty in lyr.styles])
                aggregates_name = '%s_aggregates' % lyr.name
                self.register_aggregate_style(aggregates_name,aggregates)
                # must copy layer here otherwise we'll segfault
                lyr_ = ogcserver.common.copy_layer(lyr)
                lyr_.wms_srs = layer_wms_srs
                self.register_layer(lyr_, aggregates_name, extrastyles=aggregates)
       
        #sty,rl = Style(), Rule()
        #poly = PolygonSymbolizer(Color('#f2eff9'))
        #line = LineSymbolizer(Color('#ff3366'),.5)
        #rl.symbols.extend([poly,line])
        #sty.rules.append(rl)
        #self.register_style('world_style',sty)
        #lyr = Layer('world',PROJ4_STRING)
        #lyr.datasource = Shapefile(file=SHAPEFILE)
        #lyr.title = 'World Borders'
        #lyr.abstract = 'Country Borders of the World'
        #self.register_layer(lyr,'world_style',('world_style',))
        self.finalize()
        #for e in dir(self):
            #print('== %s'%e)

def do_import(module):
    """
    Makes setuptools namespaces work
    """
    moduleobj = None
    exec 'import %s' % module 
    exec 'moduleobj=%s' % module
    return moduleobj
 
class WSGIApp:
    def __init__(self):
        self.conf = SafeConfigParser()
        self.conf.add_section('service')
        self.conf.add_section('contact')
        self.conf.set('service','allowedepsgcodes', '900913')
        self.conf.set('service','maxwidth', '4326')
        self.conf.set('service','maxheight', '4326')
        self.mapfactory = WMSFactory()
        self.debug = True
        self.max_age = None
        self.home_html = None
        self.fonts = None

    def __call__(self, environ, start_response):
        reqparams = {}
        base = True
        for key, value in parse_qs(environ['QUERY_STRING'], True).items():
            reqparams[key.lower()] = value[0]
            base = False

        if self.conf.has_option_with_value('service', 'baseurl'):
            onlineresource = '%s' % self.conf.get('service', 'baseurl')
        else:
            # if there is no baseurl in the config file try to guess a valid one
            onlineresource = 'http://%s%s%s?' % (environ['HTTP_HOST'], environ['SCRIPT_NAME'], environ['PATH_INFO'])

        try:
            if not reqparams.has_key('request'):
                raise OGCException('Missing request parameter.')
            request = reqparams['request']
            del reqparams['request']
            if request == 'GetCapabilities' and not reqparams.has_key('service'):
                raise OGCException('Missing service parameter.')
            if request in ['GetMap', 'GetFeatureInfo']:
                service = 'WMS'
            else:
                try:
                    service = reqparams['service']
                except:
                    service = 'WMS'
                    request = 'GetCapabilities'
            if reqparams.has_key('service'):
                del reqparams['service']
            try:
                ogcserver = do_import('ogcserver')
            except:
                raise OGCException('Unsupported service "%s".' % service)
            ServiceHandlerFactory = getattr(ogcserver, service).ServiceHandlerFactory
            servicehandler = ServiceHandlerFactory(self.conf, self.mapfactory, onlineresource, reqparams.get('version', None))
            if reqparams.has_key('version'):
                del reqparams['version']
            if request not in servicehandler.SERVICE_PARAMS.keys():
                raise OGCException('Operation "%s" not supported.' % request, 'OperationNotSupported')
            ogcparams = servicehandler.processParameters(request, reqparams)
            try:
                requesthandler = getattr(servicehandler, request)
            except:
                raise OGCException('Operation "%s" not supported.' % request, 'OperationNotSupported')

            # stick the user agent in the request params
            # so that we can add ugly hacks for specific buggy clients
            ogcparams['HTTP_USER_AGENT'] = environ.get('HTTP_USER_AGENT', '')

            response = requesthandler(ogcparams)
        except:
            version = reqparams.get('version', None)
            if not version:
                version = Version()
            else:
                version = Version(version)
            if version >= '1.3.0':
                eh = ExceptionHandler130(self.debug,base,self.home_html)
            else:
                eh = ExceptionHandler111(self.debug,base,self.home_html)
            response = eh.getresponse(reqparams)
        response_headers = [('Content-Type', response.content_type),('Content-Length', str(len(response.content)))]
        if self.max_age:
            response_headers.append(('Cache-Control', self.max_age))
        start_response('200 OK', response_headers)
        yield response.content
            

    
application = WSGIApp()
