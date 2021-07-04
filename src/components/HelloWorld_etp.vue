<template>
  <div class="hello">
    
    <input type="text" v-model="dataForm.name" />
    <input type="checkbox" v-model="toggle2d" />
    <sceneComp 
      :initData = initData
      :defaultData="dataForm"
      :toggle3d="toggle3d"
      :toggle2d="toggle2d"
      :togglesc="togglesc"
      :togglechecker="togglechecker"
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/electronic_tech_part/sceneComp'

import {
  TQFNdata,
  // FemaleHeaderdata,
  // R0805data
} from '../engines/electronic_tech_part'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        initData: 'TQFN',   // name of one package - TQFN, FEMALEHEADER, R0805
        dataForm: TQFNdata, // all the informations from form
        toggle3d: true,     // show 3d
        toggle2d: false,    // show 2d
        togglesc: false,    // show schematic
        togglechecker: false, // show position checker
      }
    },

    methods: {
      selectedObject (param) {
        /* eslint-disable no-console */
        console.log(param)
      }
    }
}
</script>