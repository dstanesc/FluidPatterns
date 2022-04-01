import React from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Transformer, Shape } from 'react-konva';

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {

    const shapeRef = React.useRef<any>(null);

    const trRef = React.useRef<any>(null);

    React.useEffect(() => {
        if (isSelected) {
            // we need to attach transformer manually
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <Rect
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shapeProps}
                draggable
                onDragEnd={(e) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(node.height() * scaleY),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

const initialRectangles = [
    {
        "x": 409,
        "y": 129,
        "width": 100,
        "height": 100,
        "fill": "red",
        "shadowBlur": 10,
        "cornerRadius": 10,
        "id": "rect1"
      },
      {
        "x": 278,
        "y": 340,
        "width": 112,
        "height": 100,
        "fill": "red",
        "shadowBlur": 10,
        "cornerRadius": 10,
        "id": "rect2"
      },
      {
        "x": 194,
        "y": 123,
        "width": 200,
        "height": 200,
        "fill": "green",
        "shadowBlur": 10,
        "cornerRadius": 10,
        "id": "rect3"
      },
      {
        "x": 410,
        "y": 246,
        "width": 254,
        "height": 251,
        "fill": "yellow",
        "shadowBlur": 10,
        "cornerRadius": 10,
        "id": "rect4"
      }
];

export default function App() {

    const [rectangles, setRectangles] = React.useState(initialRectangles);
    const [selectedId, selectShape] = React.useState(null);

    const checkDeselect = (e) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
        >
            <Layer>
                {rectangles.map((rect, i) => {
                    return (
                        <Rectangle
                            key={i}
                            shapeProps={rect}
                            isSelected={rect.id === selectedId}
                            onSelect={() => {
                                selectShape(rect.id);
                            }}
                            onChange={(newAttrs) => {
                                const rects = rectangles.slice();
                                rects[i] = newAttrs;
                                setRectangles(rects);
                                console.log(`${JSON.stringify(rects, null, 2)}`);
                            }}
                        />
                    );
                })}
            </Layer>
        </Stage>
    );
};