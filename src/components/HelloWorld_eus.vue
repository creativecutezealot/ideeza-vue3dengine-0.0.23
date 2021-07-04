<template>
  <div class="hello">
    
    <button @click="toggleGrid()" >Toggle Grid</button>
    <button @click="changeAction('route')" >Do Action</button>
    <!--button @click="toDefaultCameraSetting()" >reset Camera</button-->
    <input v-model="resolution" />
    <button @click="import3dModel({'name':'Comp1','transform':{'pos_sc':[0,0,0],'pos_d':[0,0,0,0]},'nets':[{'name':'Net 0','path':[[{'x':5.349999904632568,'y':0.009999999776482582,'z':0},{'x':2.1500000953674316,'y':0.009999999776482582,'z':0},{'x':2.1500000953674316,'y':0.009999999776482582,'z':-0.6000000238418579}]],'pins':[[-1,1],[0,1]]},{'name':'Net 1','path':[[{'x':0.44999992847442627,'y':0.009999999776482582,'z':-0.6000000238418579},{'x':0.44999992847442627,'y':0,'z':0},{'x':-0.1,'y':0,'z':0}],[{'x':-0.1,'y':0,'z':0},{'x':-0.1,'y':0.009999999776482582,'z':-0.6000000238418579},{'x':-0.75,'y':0.009999999776482582,'z':-0.6000000238418579}]],'pins':[[0,2],[1,1]]},{'name':'Net 2','path':[[{'x':-2.450000047683716,'y':0.009999999776482582,'z':-0.6000000238418579},{'x':-2.450000047683716,'y':0.009999999776482582,'z':0},{'x':-5.650000095367432,'y':0.009999999776482582,'z':0}]],'pins':[[1,2],[-1,2]]}],'routing_data':[],'assets':[{'transform':{'best_p':[0,0,0,0],'best_sc':[1.3,-0.6,0],'rotation':[0,0,0],'pivot':[-1.05,-0.65],'position':[0,0,0],'mirror':false,'display':0,'coverPos':[0,0,0],'coverRot':[0,0,0]},'name':'cap0805','name2d':'R','url':'user-be5e1cc3a341462690fd8d8db0dac77e.babylon','design':'user-3119100f41da4b3a8efc9e8a8cf85984.babylon','schematic':'user-1bec78f99fcc41e7a2c36377b8943b4f.babylon'},{'transform':{'best_p':[0,0,0,0],'best_sc':[-1.6,-0.6,0],'rotation':[0,0,0],'pivot':[-1.05,-0.65],'position':[0,0,0],'mirror':false,'display':0,'coverPos':[0,0,0],'coverRot':[0,0,0]},'name':'cap0805','name2d':'R','url':'user-be5e1cc3a341462690fd8d8db0dac77e.babylon','design':'user-3119100f41da4b3a8efc9e8a8cf85984.babylon','schematic':'user-1bec78f99fcc41e7a2c36377b8943b4f.babylon'}],'compSize':[20,20],'electData':{'ComponentParts':['cap0805','R','cap0805','R'],'ComponentToParts':[[1,0,1],[2,1,2]],'PartToPart':[[0,1],[0,2,1,1],[1,2]],'PartToPartNames':['Net 0','Net 1','Net 2'],'need':{'pin':['1/vcc'],'vcc':false},'pass':{'pin':['2/gnd'],'gnd':false}}})">Comp1</button>
    <button @click="import3dModel({'name':'Comp2','transform':{'pos_sc':[0,0,0],'pos_d':[0,0,0,0]},'assets':[{'transform':{'best_p':[0,0,0,0],'best_sc':[-1,0.10000000000000006,0],'position':[0,0,0],'rotation':[0,0,0],'pivot':[-4.67,-4.67]},'name':'ATmega328','name2d':'AT','url':'user-e71413056a4049e399aad42118410e87.babylon','design':'user-0e1383d25be244a08f024106d03ac8ae.babylon','schematic':'user-6cb573279715425db9fec438d44c73b8.babylon'}],'nets':[{'name':'Net 0','path':[[{'x':3.4000000953674316,'y':0.009999999776482582,'z':-0.30000001192092896},{'x':2.2,'y':0,'z':-0.30000001192092896},{'x':2.2,'y':0,'z':-1}],[{'x':2.2,'y':0,'z':-1},{'x':2.2,'y':0.009999999776482582,'z':-1.149999976158142},{'x':0.20000004768371582,'y':0.009999999776482582,'z':-1.149999976158142}]],'pins':[[-1,1],[0,11]]},{'name':'Net 1','path':[[{'x':3.4000000953674316,'y':0.009999999776482582,'z':0.30000001192092896},{'x':3.4000000953674316,'y':0.009999999776482582,'z':1.350000023841858},{'x':0.20000004768371582,'y':0.009999999776482582,'z':1.350000023841858}]],'pins':[[-1,2],[0,6]]},{'name':'Net 2','path':[[{'x':-2.200000047683716,'y':0.009999999776482582,'z':-0.15000000596046448},{'x':-5.400000095367432,'y':0.009999999776482582,'z':-0.15000000596046448},{'x':-5.400000095367432,'y':0.009999999776482582,'z':0}]],'pins':[[0,25],[-1,3]]}],'routing_data':[],'compSize':[20,20],'electData':{'ComponentParts':['ATmega328','AT'],'ComponentToParts':[[1,0,11],[2,0,6],[3,0,25]],'PartToPart':[[0,11],[0,6],[0,25]],'PartToPartNames':['Net 0','Net 1','Net 2'],'need':{'pin':['1/vcc','2/gnd'],'vcc':false,'gnd':false},'pass':{'pin':['3/ac1'],'ac1':false}}})">Comp2</button>

    <sceneComp 
      :init-data="initDataForEngine"
      :visibleGrid="visibleGrid"
      :group-button="doAction"
      :part-data="partDataForImport"
      :resolution="parseInt(resolution)"
      @selectObject="selectedObject"
    ></sceneComp>

    <div v-if="showTech">
      <button @click="hide2nd()">Close</button>
      <sceneCompt 
        :init-data="inportedinsecond"
      ></sceneCompt>
    </div>
  </div>
</template>

<script>
import sceneComp from './engines/electronic_user_s/sceneComp'
import sceneCompt from './engines/electronic_tech_comp_s/sceneComp'

export default {
    components: {
      sceneComp,
      sceneCompt
    },

    data() {
      return {
        visibleGrid: true,        // show the grid
        initDataForEngine: {},    // the entire object need to init the engine, at the begining is empty
        doAction: "move",         // move, rotate, copy, delete, label, route, highlight
        resolution: 10,           // min: 1, max: 100.
        partDataForImport: {},    // the entire object need to import a part
        inportedinsecond: {},     // come from first engine, render in second
        showTech: false
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
      hide2nd () {
        this.showTech = false
      },
      selectedObject (param) {
        this.inportedinsecond = param
        this.showTech = true
        /* eslint-disable no-console */
        console.log('data of this comp ',JSON.stringify(param))
      }
    }
}
</script>