<template>
  <div class="hello">
    
    <button @click="toggleGrid()" >Toggle Grid</button>
    <button @click="changeAction('route')" >Do Action</button>
    <button @click="toggle2d3d()" >Toggle 2d/3d</button>
    <!--button @click="toDefaultCameraSetting()" >reset Camera</button-->
    <input v-model="resolution" />
    <input v-model="componentSize[0]" />
    <input v-model="componentSize[1]" />
    <input v-model="wireWidth" />

    <sceneComp 
      :init-data="initDataForEngine"
      :visibleGrid="visibleGrid"
      :componentSize="componentSize"
      :visible3d="visible3d"
      :group-button="doAction"
      :resolution="parseInt(resolution)"
      @selectObject="selectedObject"
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/electronic_tech_comp_d/sceneComp'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        visibleGrid: true,        // show the grid
        initDataForEngine: {
          "nets":[],
          "routing_data":[],
          "assets":[{"transform":{"best_p":[0,0,0,0],"best_sc":[0,0,0],"position":[0,0,0],"rotation":[0,0,0],"pivot":[-4.67,-4.67]},"name":"ATmega328","name2d":"AT","url":"user-e71413056a4049e399aad42118410e87.babylon","design":"user-0e1383d25be244a08f024106d03ac8ae.babylon","schematic":"user-6cb573279715425db9fec438d44c73b8.babylon"}],
          "compSize":[20,20]
        },                        // the entire object need on init, those infos come from schematic engine
        doAction: "move",         // 'move','rotate','mirror','label','route','highlight','delete'
        resolution: 10,           // min: 1, max: 100.
        componentSize: [20, 20],  // size of component
        visible3d: false,         // show/hide 3d objects
        wireWidth: 0.1            // width of wire
      }
    },

    methods: {
      toggleGrid() {
        this.visibleGrid = !this.visibleGrid
      },
      toggle2d3d() {
        this.visible3d = !this.visible3d
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