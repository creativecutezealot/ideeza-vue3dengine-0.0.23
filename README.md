# VUE 3D ENGINES - IDEEZA

## How to run this project

```
npm install
npm run serve - local build
npm run build-bundle - build for packages
npm pack - to create the package
```

## How to use components
```
import <Name_you_want> from '@ideeza/vue3dengine';
```
It contains 2 components for now:
1. Name_you_want.etcs - the scene for electronic technician addComponent schematic
2. Name_you_want.etcd - the scene for electronic technician addComponent design
3. Name_you_want.ct   - the scene for cover technician (all scenes, need only one param on init, to init the right engine)
4. Name_you_want.etp  - the scene for electronic technician part
5. Name_you_want.eus  - the scene for electronic user schematic
6. Name_you_want.eud  - the scene for electronic user design
7. Name_you_want.cu   - the scene for cover user
8. Name_you_want.gu   - the scene for general user
9. Name_you_want.cou  - the scene for code user
10. Name_you_want.s3d - the scene for show a simpe 3d object

Like this I'll all the engines.

In vue, you can use it something like this:
```
<template>
  <div class="hello">
    <comp1 
      :init-data="initDataForEngine"
      :pins-data="initDataForPins"
      :visibleGrid="visibleGrid"
      :group-button="doAction"
      :part-data="partDataForImport"
      :resolution="parseInt(resolution)"
      @selectObject="selectedObject"
    ></comp1>

    <button @click="toggleGrid()" >Toggle Grid</button>
    <button @click="changeAction('route')" >Do Action</button>
    <!--button @click="toDefaultCameraSetting()" >reset Camera</button - need to be called from engine-->
    <input v-model="resolution" />
    <button @click="import3dModel({'transform':{'best_p':[0, 0, 0, 0],'best_sc':[0, 0, 0],'position':[0,0,0],'rotation':[0,0,0],'pivot':[-4.67,-4.67]},'name':'ATmega328','name2d':'AT','url':'user-e71413056a4049e399aad42118410e87.babylon','design':'user-0e1383d25be244a08f024106d03ac8ae.babylon','schematic':'user-6cb573279715425db9fec438d44c73b8.babylon'})">ATmega328</button>
  </div>
</template>

<script>
import * as Comp from '@ideeza/vue3dengine'

const comp1 = Comp.etcs

export default {
    components: {
      comp1
    },

    data() {
      return {
        visibleGrid: true,        // show the grid
        initDataForEngine: {},    // the entire object need to init the engine, at the begining is empty
        initDataForPins: {
          need: {},
          pass: {}
        },                        // the entire object need on adding pins
        doAction: "move",         // move, rotate, copy, delete, label, route, highlight
        resolution: 10,           // min: 1, max: 100.
        partDataForImport: {}     // the entire object need to import a part
      }
    },

    methods: {
      toggleGrid() {
        this.visibleGrid = !this.visibleGrid
      },
      import3dModel(param){
        this.partDataForImport = param;
      },
      changeAction(action) {
        this.doAction = action
      },
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
<style scoped>
</style>
```