<template>
  <div id="blocklyDiv"></div>
</template>

<script>
// engine for user code
import { pcb3D } from '../../../engines/code_user' 

export default {
  name: 'cou',

  props: {
    initData: {               // the object used to init the engine
      type: Object,
      default: () => {}    
    }
  },
  watch: {},

  created () {
    this._scene = null
    this._engine = null
  },

  methods: {
    initCustomEngine () {
      /* eslint-disable no-console */
      pcb3D.init(this.initData)
    },
    
    getData () {
      pcb3D.getData()
    },

    disposeCustomEngine () {
      pcb3D.disposeEngine()
    }
  },

  mounted () {
    this.$emit('sceneMount')
    this.initCustomEngine()
  },

  beforeDestroy: function () {
    this.disposeCustomEngine()
  }
}
</script>

<style scoped>
#blocklyDiv {
  width: 990px;
  height: 480px;
}
</style>