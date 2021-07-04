<template>
  <div class="hello">
    
    <button @click="toggleGrid()" >Toggle Grid</button>
    <button @click="changeTransf('rotate')" >Transform</button>
    <button @click="import3dModel({'transform':{'position':[0,0,0],'rotation':[0,0,0],'scale':[1,1,1],'color':'#1f1f1f'},'url':'user-5272f6574e9b4c2b955bb3a6dbc45795.glb'})" >Import Model</button>
    <input type="color" v-model="background" />
    <input type="color" v-model="objectColor" />
    <input type="number" v-model="transformData[0]" />
    <input type="text" v-model="apiPlatform" />
    <input type="text" v-model="searchFor" />
    <input type="file" multiple @change="upload3dModel($event)" />
    
    <sceneComp 
      :init-data="initDataForEngine"
      :router="router"
      :visibleGrid="visibleGrid" 
      :transform="transform" 
      :transformData="transformData" 
      :objectData="objectData" 
      :objectColor="objectColor" 
      :uploadData="uploadData" 
      :background="background"
      :apiPlatform="apiPlatform"
      :searchFor="searchFor"
      @selectObject="selectedObject"
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/cover_tech/sceneComp'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        visibleGrid: true,        // show the grid
        initDataForEngine: {},    // the entire object need to init the engine, at the begining is empty
        router: 0,                // type of scene - part -0, component -1, cover -2
        background: "#ffffff",    // backround color - hex string
        transform: "translate",   // type of transform in scene - translate, rotate, scale
        objectData: {},           // the object used to import a 3d object
        uploadData: null,         // the event from upload
        transformData: [0, 'X'],  // first is the value of input, second is axis - X,Y,Z(string)
        objectColor: "#ffffff",   // color of object
        apiPlatform: "polygoogle",// site where we search polygoogle/remix3d
        searchFor: "",            // text after we search
      }
    },

    methods: {
      toggleGrid() {
        this.visibleGrid = !this.visibleGrid
      },
      changeTransf(param) {
        this.transform = param
      },
      import3dModel(param){
        this.objectData = param;
      },
      upload3dModel(param){
        this.uploadData = param;
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