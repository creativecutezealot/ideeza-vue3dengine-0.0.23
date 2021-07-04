<template>
  <div class="hello">
    
    <sceneComp
    :initData = initData
    ></sceneComp>

  </div>
</template>

<script>
import sceneComp from './engines/code_user/sceneComp'

export default {
    components: {
      sceneComp
    },

    data() {
      return {
        initData: {
          'array': [],
          'code': '',
          'xml': '<xml xmlns="http://www.w3.org/1999/xhtml"><variables><variable type="" id="]?c=?lOfo+]KT7h;L,s,">ID</variable><variable type="" id="o0bLn9R[fPg{mJx!;I#3">counter</variable><variable type="" id="jnV=zY(C5[fDF05-PLl3">time</variable><variable type="" id="K]XVSz54Ub.6WpbIC;!w">freq</variable><variable type="" id="-s/hH1gRkbLKOkG!1Ko,">TH</variable></variables><block type="repeater" id="Ab{PSP:#Ao8yLIi@HG)Q" x="52" y="13"><value name="VALUE"><block type="ATmega644" id="nPA)iU1_5r@^!d#L~vSg"><statement name="CPU1"><block type="controls_whileUntil" id="Gk{fSdvlQrmo6C:g^O,Z"><field name="MODE">WHILE</field><value name="BOOL"><block type="logic_operation" id="O.qHw$n~-j^*1|wlD?gZ"><field name="OP">OR</field><value name="A"><block type="Timing" id="@;2I`3lDjnV36/f@RIfu"><field name="FUNCTION">time</field><value name="TIMES"><block type="math_number" id="]]Dwcf+Q?ts6KiQ~(xIW"><field name="NUM">24</field></block></value></block></value><value name="B"><block type="sx1278_1" id="B!BVLidRX3Kg*69s2lFp"><field name="FUNCTION">recieveIntr</field></block></value></block></value><statement name="DO"><block type="controls_whileUntil" id="+maEG!gH`@$0E04w$!s["><field name="MODE">WHILE</field><value name="BOOL"><block type="cpu" id="cXC~]Kc6^CEm9gDjLsI`"><field name="FUNCTION">sleep_mode</field><value name="TIMES1"><block type="math_number" id=":QM-OHriTYH3bJ3Cd0L/"><field name="NUM">4</field></block></value><value name="TIMES2"><block type="variables_get" id="qO#g_+{b;L*_yi|n*+3X"><field name="VAR" id="jnV=zY(C5[fDF05-PLl3" variabletype="">time</field></block></value></block></value><statement name="DO"><block type="IR" id="jG(jvTfk}IX0!Q/4~Fgd"><field name="FUNCTION">transmit</field><value name="TIMES"><block type="variables_get" id="^m1BxzSH:2[V;h0nedc`"><field name="VAR" id="K]XVSz54Ub.6WpbIC;!w" variabletype="">freq</field></block></value><next><block type="controls_if" id="LxB)Vn%)C?WC63p`4n.Z"><value name="IF0"><block type="logic_compare" id="i2mCo$pF/3;Yei4n02j0"><field name="OP">GT</field><value name="A"><block type="detector" id="B;zNJ02]Zgl`Z3~M!bxz"><field name="FUNCTION">listen</field></block></value><value name="B"><block type="variables_get" id="AUy`rc6eKCex)N|KPLv?"><field name="VAR" id="-s/hH1gRkbLKOkG!1Ko," variabletype="">TH</field></block></value></block></value><statement name="DO0"><block type="math_change" id="pV=N4`Urbx,O/fo@mXFQ"><field name="VAR" id="o0bLn9R[fPg{mJx!;I#3" variabletype="">counter</field><value name="DELTA"><shadow type="math_number" id=")GqwhzAdR`5{O%jmM!fn"><field name="NUM">1</field></shadow></value></block></statement></block></next></block></statement></block></statement><next><block type="sx1278_2" id="j%i?+sIOe4(~+6CA46/g"><field name="FUNCTION">send</field><value name="TIMES1"><block type="text" id="Syr*nW~p}1aA9jmgT~XE"><field name="TEXT">Repeater</field></block></value><value name="TIMES2"><block type="variables_get" id="z1q7G#.xhHE[uL8|`42p"><field name="VAR" id="]?c=?lOfo+]KT7h;L,s," variabletype="">ID</field></block></value><value name="TIMES3"><block type="variables_get" id="ZvQcGenlmlM+tNv,#G+#"><field name="VAR" id="o0bLn9R[fPg{mJx!;I#3" variabletype="">counter</field></block></value><value name="TIMES4"><block type="temperature" id="0FI8j!=xJ8hB5gbcRQgH"><field name="FUNCTION">temp</field></block></value></block></next></block></statement></block></value></block></xml>'
        }  // data needed to create a diagram
      }
    },

    methods: {
    }
}
</script>