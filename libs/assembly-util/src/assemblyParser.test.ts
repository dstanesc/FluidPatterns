import { parseChangeSet } from "./assemblyParser"

const FIRST_INSERT = {
    "insert": {
        "String": {
            "Tracker_DDS": "3d8fb80a-0bd9-4dc4-aaba-60f0773fb8eb",
            "MyId": "7093bbc3-d9e8-4710-b8e3-63c8ecac31d0"
        },
        "hex:assembly-1.0.0": {
            "assembly": {
                "map<hex:assemblyComponent-1.0.0>": {
                    "components": {
                        "insert": {
                            "hex:assemblyComponent-1.0.0": {
                                "rect1": {
                                    "String": {
                                        "id": "rect1",
                                        "fill": "#eeff41",
                                        "annotation": "",
                                        "guid": "c19bc8b1-dae0-15a2-5f2f-a69b45353950"
                                    },
                                    "Int32": {
                                        "x": 409,
                                        "y": 129,
                                        "width": 100,
                                        "height": 100
                                    }
                                },
                                "rect2": {
                                    "String": {
                                        "id": "rect2",
                                        "fill": "#ffab40",
                                        "annotation": "",
                                        "guid": "3775d3a3-ea51-2ac8-ed3b-ec7072df061d"
                                    },
                                    "Int32": {
                                        "x": 278,
                                        "y": 340,
                                        "width": 112,
                                        "height": 100
                                    }
                                },
                                "rect3": {
                                    "String": {
                                        "id": "rect3",
                                        "fill": "#4285f4",
                                        "annotation": "",
                                        "guid": "8ece9728-8a9e-75f7-0306-8d9966504a0c"
                                    },
                                    "Int32": {
                                        "x": 194,
                                        "y": 123,
                                        "width": 200,
                                        "height": 200
                                    }
                                },
                                "rect4": {
                                    "String": {
                                        "id": "rect4",
                                        "fill": "#0097a7",
                                        "annotation": "",
                                        "guid": "784be811-cf41-87cc-a06a-a52c08470ce7"
                                    },
                                    "Int32": {
                                        "x": 410,
                                        "y": 246,
                                        "width": 254,
                                        "height": 251
                                    }
                                }
                            }
                        }
                    }
                },
                "String": {
                    "guid": "cf87fbd3-3b10-8ad6-0dc3-51a6d95216d8"
                }
            }
        }
    }
}


const SECOND_UPDATE = {
    "modify": {
        "hex:assembly-1.0.0": {
            "assembly": {
                "map<hex:assemblyComponent-1.0.0>": {
                    "components": {
                        "modify": {
                            "hex:assemblyComponent-1.0.0": {
                                "rect1": {
                                    "String": {
                                        "annotation": {
                                            "value": "This is the yellow component",
                                            "oldValue": ""
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

const THIRD_UPDATE = {
    "modify": {
        "hex:assembly-1.0.0": {
            "assembly": {
                "map<hex:assemblyComponent-1.0.0>": {
                    "components": {
                        "modify": {
                            "hex:assemblyComponent-1.0.0": {
                                "rect1": {
                                    "Int32": {
                                        "x": {
                                            "value": 614,
                                            "oldValue": 409
                                        },
                                        "y": {
                                            "value": 116,
                                            "oldValue": 129
                                        }
                                    },
                                    "String": {
                                        "annotation": {
                                            "value": "yello fella",
                                            "oldValue": ""
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}


describe("Parser test", function () {

    const cleanUp = () => {
    }

    test("parse initial insert", () => {

        const { "inserted": inserted, "modified": modified } = parseChangeSet(FIRST_INSERT);

        expect(modified).toEqual([]);

        expect(inserted[0]).toEqual({
            "id": "rect1",
            "annotation": "",
            "fill": "#eeff41",
            "x": 409,
            "y": 129,
            "width": 100,
            "height": 100
        });

        expect(inserted[1]).toEqual({
            "id": "rect2",
            "annotation": "",
            "fill": "#ffab40",
            "x": 278,
            "y": 340,
            "width": 112,
            "height": 100
        });

    });

    test("parse second modify", () => {

        const { "inserted": inserted, "modified": modified } = parseChangeSet(SECOND_UPDATE);

        expect(inserted).toEqual([]);

        expect(modified[0]).toEqual({
            "id": "rect1",
            "annotation": "This is the yellow component"
        });
    });


    test("parse third modify", () => {

        const { "inserted": inserted, "modified": modified } = parseChangeSet(THIRD_UPDATE);

        expect(inserted).toEqual([]);

        expect(modified[0]).toEqual({
            "id": "rect1",
            "annotation": "yello fella",
            "x": 614,
            "y": 116
        });
    });

    afterEach(function () {
        cleanUp();
    });

});


