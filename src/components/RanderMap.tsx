import React,{useEffect, useRef, useState} from "react"; 

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from "ol/layer/Tile";
import OSM from 'ol/source/OSM';
import  Feature from 'ol/Feature';
import {Vector as VectorLayer} from 'ol/layer';
import { Vector as VectorSource } from "ol/source";
import {Icon, Style} from 'ol/style'
import {Draw } from 'ol/interaction' ;
import {Point, LineString, Polygon} from 'ol/geom';
import { Geometry } from 'ol/geom';

const RanderMap: React.FC = () =>{

    const [intractionType, setIntractionType] = useState<string>('Point')
    const mapRef = useRef<Map | null> (null);
    const vectorLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);

    useEffect(() => {
        mapRef.current = new Map({
            target:'map',
            layers:[
                new TileLayer({
                    source: new OSM(),
                }),

            ],

            view: new View({
                center:[0,0],
                zoom: 3,
            }),
        });

        vectorLayerRef.current = new VectorLayer({
            source: new VectorSource<Feature<Geometry>>(),        
        });

        mapRef.current.addLayer(vectorLayerRef.current);

        const map = mapRef.current;

        const vectorLayer = vectorLayerRef.current;

       const handleIntraction = (type:string) =>{
        const draw = new Draw({
            source: vectorLayer.getSource(),
            type:type,
        });
        map.addInteraction(draw);
       };

    
    handleIntraction(intractionType);
    // handleIntraction('Point')
    // handleIntraction('LineString')
    // handleIntraction('Polygon')


    return () => {
        map?.dispose();
    };

    }, [intractionType]);
   
    const handleIntraction = (event: React.ChangeEvent<HTMLSelectElement>) =>{
        setIntractionType(event.target.value)
    }
    return <>
    <div id="map" style={{width:'100%', height:'580px'}}></div>
    <div>
        <label htmlFor="draw-type">Select Intraction Type :</label>
        <select id="draw-type" value={intractionType} onChange={handleIntraction} >
            <option value="Point">Point</option>
            <option value="LineString">Line</option>
            <option value="Polygon">Polygon</option>
        </select>
    </div>
    </>
};

export default RanderMap;

