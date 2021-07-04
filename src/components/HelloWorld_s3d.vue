<template>
  <div class="hello">

    <sceneComp 
      :link="link"
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/show_3d/sceneComp'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        link: 'user-5272f6574e9b4c2b955bb3a6dbc45795.glb'
      }
    },

    methods: {}
}
</script>