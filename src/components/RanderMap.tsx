import React, { useEffect, useRef, useState } from "react";
import "../app/globals.css";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Draw, Select } from "ol/interaction";
import { Point, LineString, Polygon } from "ol/geom";
import { getArea, getLength } from "ol/sphere";
import { Style, Fill, Stroke, Circle } from "ol/style";

// Component to render a map using open layer
const RenderMap: React.FC = () => {
  
  // declared state to manage the component data
  const [interactionType, setInteractionType] = useState<string>("");
  const mapRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource<Feature>> | null>(
    null
  );
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const selectInteractionRef = useRef<Select | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);

  // co-ordinates to macke india in center
  const indiaCenter = [8623558.348379135, 2933417.105845575];

  // Here we are rendering the map
  useEffect(() => {
    mapRef.current = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: indiaCenter,
        zoom: 3,
      }),
    });

    // Function to style the drawing

    const polygonStyleFunction = () => {
      return new Style({
        fill: new Fill({
          color: "rgba(23, 78, 15, 0.5)",
        }),
        stroke: new Stroke({
          color: "rgba(23, 78, 15, 1)",
          width: 3,
        }),

        image: new Circle({
          fill: new Fill({
            color: "rgba(23, 78, 15, 0.8)",
          }),
          radius: 8,
        }),
      });
    };

    // created a instance of a vectore layer to access the vector layer instance from the application
    vectorLayerRef.current = new VectorLayer({
      source: new VectorSource<Feature>(),
      style: polygonStyleFunction(),
    });

    // here we are adding a vector layer to the map
    mapRef.current.addLayer(vectorLayerRef.current);

    // created a instance of Select to intract with map
    selectInteractionRef.current = new Select({
      condition: (evt) => {
        return evt.type === "pointermove";
      },
    });

    mapRef.current.addInteraction(selectInteractionRef.current);

    return () => {
      mapRef.current?.dispose();
    };
  }, []);

  // function to handle the drawing intraction in the map like Draw, poin, Polygon
  const handleInteraction = (type: string) => {
    if (!type) return;
    const draw = new Draw({
      source: vectorLayerRef.current!.getSource(),
      type: type as any,
    });

    draw.on("drawend", (event: any) => {
      const feature = event.feature;
      let measurement = "";

      if (type === "Point") {
        measurement = "";
      } else if (type === "LineString") {
        const lineString = feature.getGeometry() as LineString;
        measurement = `Distance: ${(getLength(lineString) / 1000).toFixed(
          2
        )} km`;
      } else if (type === "Polygon") {
        const polygon = feature.getGeometry() as Polygon;
        measurement = `Area : ${(getArea(polygon) / 1000000).toFixed(2)} km^2`;
      }

      feature.set("measurement", measurement);
    });

    mapRef.current?.addInteraction(draw);
    drawInteractionRef.current = draw;
  };

  useEffect(() => {
    handleInteraction(interactionType);
    return () => {
      if (drawInteractionRef.current) {
        mapRef.current?.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [interactionType]);

  // function to update the intraction type as per the user selection
  const handleInteractionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setInteractionType(event.target.value);
  };

  // here we are handling the measurement of the drawing
  useEffect(() => {
    selectInteractionRef.current?.on("select", (event) => {
      const selectedFeature = event.selected[0];
      if (selectedFeature) {
        const measurement = selectedFeature.get("measurement") || "";
        setTooltipContent(measurement);
      } else {
        setTooltipContent("");
      }
    });
  }, []);

  useEffect(() => {
    const mapElement = document.getElementById("map");
    if (mapElement) {
      mapElement.addEventListener("mousemove", handleMouseMove);
      return () => {
        mapElement.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, []);

  // here we are handling the mouse event so that we can select the drawing
  const handleMouseMove = (event: MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  // function to clear the drawing from the map
  const handleClearDrawing = () => {
    if (drawInteractionRef.current) {
      mapRef.current?.removeInteraction(drawInteractionRef.current);
      vectorLayerRef.current!.getSource().clear();
    }
  };

  // created and styled an element for the measurement pop
  const tooltip = tooltipContent && (
    <div
      style={{
        position: "absolute",
        top: tooltipPosition.y + 10,
        left: tooltipPosition.x + 10,
        backgroundColor: "gray",
        padding: "5px 10px",
        borderRadius: "5px",
        zIndex: 9999,
      }}
    >
      {tooltipContent}
    </div>
  );

  return (
    <>
      <div className="flex justify-between bg-white h-24 w-full p-8 ">
        <h1 className="text-3xl text-green-800 font-bold">Ottermap</h1>
        <div className="flex justify-between text-green-800 gap-6 font-bold pr-10 sm: mt-1 gap-3 pr-5 ">
          <div>
            <label className="text-2xl" htmlFor="draw-type">
              Draw :{" "}
            </label>
            <select
              className="bg-gray-400 rounded-md h-8 w-20 p-1 text-sm border-green-800 border-2 hover:bg-white"
              id="draw-type"
              value={interactionType}
              onChange={handleInteractionChange}
            >
              <option value="">None</option>
              <option value="Point">Point</option>
              <option value="LineString">Line</option>
              <option value="Polygon">Polygon</option>
            </select>
          </div>
          <button
            className="bg-gray-400 rounded-md h-8 w-20 mt-1 border-green-800 border-2 hover:bg-white"
            onClick={handleClearDrawing}
          >
            Clear
          </button>
        </div>
      </div>

      <div id="map" style={{ width: "100%", height: "630px" }}></div>
      {tooltip}
    </>
  );
};

export default RenderMap;
