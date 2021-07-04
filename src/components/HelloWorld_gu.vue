<template>
  <div class="hello">

    <sceneComp 
      :init-data="initDataForEngine"
      @selectObject="selectedObject"
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/general_user/sceneComp'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        initDataForEngine: {  // the entire object need to init the engine, it can be empty
          "electronics": {
            "nets": [],
            "routing": [],
            "assets": [{
                "name": "Comp1",
                "transform": {
                  "pos_sc": [1.4, -0.2, 0],
                  "pos_d": [0, 0, 0, 0]
                },
                "nets": [{
                    "name": "Net 0",
                    "path": [[{
                          "x": 5.349999904632568,
                          "y": 0.009999999776482582,
                          "z": 0
                        }, {
                          "x": 2.1500000953674316,
                          "y": 0.009999999776482582,
                          "z": 0
                        }, {
                          "x": 2.1500000953674316,
                          "y": 0.009999999776482582,
                          "z": -0.6000000238418579
                        }
                      ]],
                    "pins": [[-1, 1], [0, 1]]
                  }, {
                    "name": "Net 1",
                    "path": [[{
                          "x": 0.44999992847442627,
                          "y": 0.009999999776482582,
                          "z": -0.6000000238418579
                        }, {
                          "x": 0.44999992847442627,
                          "y": 0,
                          "z": 0
                        }, {
                          "x": -0.1,
                          "y": 0,
                          "z": 0
                        }
                      ], [{
                          "x": -0.1,
                          "y": 0,
                          "z": 0
                        }, {
                          "x": -0.1,
                          "y": 0.009999999776482582,
                          "z": -0.6000000238418579
                        }, {
                          "x": -0.75,
                          "y": 0.009999999776482582,
                          "z": -0.6000000238418579
                        }
                      ]],
                    "pins": [[0, 2], [1, 1]]
                  }, {
                    "name": "Net 2",
                    "path": [[{
                          "x": -2.450000047683716,
                          "y": 0.009999999776482582,
                          "z": -0.6000000238418579
                        }, {
                          "x": -2.450000047683716,
                          "y": 0.009999999776482582,
                          "z": 0
                        }, {
                          "x": -5.650000095367432,
                          "y": 0.009999999776482582,
                          "z": 0
                        }
                      ]],
                    "pins": [[1, 2], [-1, 2]]
                  }
                ],
                "routing_data": [],
                "assets": [{
                    "transform": {
                      "best_p": [0, 0, 0, 0],
                      "best_sc": [1.3, -0.6, 0],
                      "rotation": [0, 0, 0],
                      "pivot": [-1.05, -0.65],
                      "position": [1.5, 0, 0],
                      "mirror": false,
                      "display": 0,
                      "coverPos": [0, 0, 0],
                      "coverRot": [0, 0, 0]
                    },
                    "name": "cap0805",
                    "name2d": "R",
                    "url": "user-be5e1cc3a341462690fd8d8db0dac77e.babylon",
                    "design": "user-3119100f41da4b3a8efc9e8a8cf85984.babylon",
                    "schematic": "user-1bec78f99fcc41e7a2c36377b8943b4f.babylon"
                  }, {
                    "transform": {
                      "best_p": [0, 0, 0, 0],
                      "best_sc": [-1.6, -0.6, 0],
                      "rotation": [0, 0, 0],
                      "pivot": [-1.05, -0.65],
                      "position": [-1.5, 0, 0],
                      "mirror": false,
                      "display": 0,
                      "coverPos": [0, 0, 0],
                      "coverRot": [0, 0, 0]
                    },
                    "name": "cap0805",
                    "name2d": "R",
                    "url": "user-be5e1cc3a341462690fd8d8db0dac77e.babylon",
                    "design": "user-3119100f41da4b3a8efc9e8a8cf85984.babylon",
                    "schematic": "user-1bec78f99fcc41e7a2c36377b8943b4f.babylon"
                  }
                ],
                "compSize": [8, 3],
                "electData": {
                  "ComponentParts": ["cap0805", "R", "cap0805", "R"],
                  "ComponentToParts": [[1, 0, 1], [2, 1, 2]],
                  "PartToPart": [[0, 1], [0, 2, 1, 1], [1, 2]],
                  "PartToPartNames": ["Net 0", "Net 1", "Net 2"],
                  "need": {
                    "pin": ["1/vcc"],
                    "vcc": false
                  },
                  "pass": {
                    "pin": ["2/gnd"],
                    "gnd": false
                  }
                }
              }
            ],
            "compSize": [50, 50],
            "electData": {
              "PartToPart": [],
              "PartToPart2": []
            }
          },
          "cover": {
            "engine": [[[{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [0, 0, 0],
                      "scale": [50, 0.01, 50],
                      "position": [0, -10, 0]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ], [{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [0, 0, 0],
                      "scale": [50, 0.01, 50],
                      "position": [0, 10, 0]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ], [{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [90, 90, 0],
                      "scale": [50, 0.01, 20],
                      "position": [-25, 0, 0]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ], [{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [90, 90, 0],
                      "scale": [50, 0.01, 20],
                      "position": [25, 0, 0]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ], [{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [0, 90, 90],
                      "scale": [20, 0.01, 50],
                      "position": [0, 0, -25]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ], [{
                    "transform": {
                      "color": "#6d0253",
                      "electronic": true,
                      "rotation": [0, 90, 90],
                      "scale": [20, 0.01, 50],
                      "position": [0, 0, 25]
                    },
                    "indexDBId": "add-cover-technician",
                    "url": "user-6f7326715bc046f9a6aec22563a2fe4f.glb"
                  }
                ]]],
            "transform": []
          },
          "general": {
            "position": [[0, 0, 0]],
            "rotation": [[0, 0, 0]],
            "scaling": [[1, 1, 1]],
            "pilon": [[]],
            "wires": [],
            "coverHoles": [[], [], [], [], [], []],
            "battery": [{
                "link": "",
                "position": [0, 0, 0],
                "rotation": [0, 0, 0],
                "scale": [1, 1, 1]
              }
            ]
          }
        }
      }
    },

    methods: {
      selectedObject (param) {
        switch (param) {
          case '0':
            // console.log('clicked on board')
            break;
          case '1':
            // console.log('clicked on part')
            break
          case '2':
            // console.log('clicked on wire')
            break;
          default:
            break;
        }
      }
    }
}
</script>