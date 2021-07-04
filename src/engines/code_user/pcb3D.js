/* eslint-disable no-console */
import Blockly from 'node-blockly/browser';

export default {
  selected: null,
  data: {},
  toolbox: null,
  workspace: null,
  init (data) {
    console.log(data)
    
    // create the blocks which doesn't exist, like network, cpu
    this.createBlocks()

    this.toolbox = this.createToolbox()
    this.workspace = Blockly.inject('blocklyDiv', {toolbox: this.toolbox});
   
    if (Object.keys(data).length === 0) {
      this.data = {
        'xml': '',
        'array': '',
        'code': ''
      }
    }
    else {
      this.data = data
      console.log(data);
      if (this.data['xml'].length !== 0) {
        this.getSavedBlocks(this.data['xml'])
      }
    }
  },

  createToolbox () {
    const name1 = ['Control', 'Logic', 'Math', 'Text', 'Lists', 'Colors', 'Variables', 'Procedures', 'Network', 'CPU','Components']
    const colors = ['%{BKY_LOOPS_HUE}', '%{BKY_LOGIC_HUE}', '%{BKY_MATH_HUE}', '%{BKY_TEXTS_HUE}','%{BKY_LISTS_HUE}','%{BKY_COLOUR_HUE}','%{BKY_VARIABLES_HUE}','%{BKY_PROCEDURES_HUE}','20', '50','190']
    const custom = ['', '', '','', '', '','VARIABLE', 'PROCEDURE','','','']

    const subCat = {
      'Control': ['controls_repeat_ext','controls_whileUntil','controls_for','controls_forEach','controls_flow_statements'],
      'Logic': ['controls_if','controls_ifelse','logic_boolean','logic_compare','logic_negate','logic_null','logic_operation'],
      'Math': ['math_number','math_constant','math_arithmetic','math_number_property','math_on_list','math_random_float','math_random_int','math_round','math_single','math_trig'],
      'Text': ['text','text_changeCase','text_count','text_isEmpty','text_length','text_print','text_prompt','text_prompt_ext','text_replace','text_reverse','text_trim'],
      'Lists': ['lists_create_empty','lists_create_with','lists_create_with_container','lists_create_with_item','lists_getIndex','lists_getSublist','lists_indexOf','lists_isEmpty','lists_length','lists_repeat','lists_reverse','lists_setIndex','lists_sort','lists_split'],
      'Colors': ['colour_picker','colour_blend','colour_random','colour_rgb'],
      'Variables': ['variables_get','variables_get_dynamic','variables_set','variables_set_dynamic'],
      'Procedures': [],
      'Network': ['regular', 'master_slave','repeater'],
      'CPU': ['ATmega328', 'ATtiny85', 'ATmega644'],
      'Components': ['HM-10','PushButton','Esp826612E3','ArduCam5MP','Timing', 'IR','detector','sx1278_1','sx1278_2','cpu','temperature']
    } 

    let toolbox = '<xml>';
    for (let i = 0; i < name1.length; i++) {
      if (custom[i].length !== 0) {
        toolbox += '  <category name="' + name1[i] + '" colour="' + colors[i] + '" custom="' + custom[i] + '">';
      }
      else {
        toolbox += '  <category name="' + name1[i] + '" colour="' + colors[i] + '">';
      }      
      for (let j = 0; j < subCat[name1[i]].length; j++) {
        toolbox += '    <block type="' + subCat[name1[i]][j] + '"></block>';
      }
     
      toolbox += '  </category>';

      if (i === 7) {
        toolbox += '<sep></sep><sep></sep>';
      }
    }
  
    toolbox += '</xml>';
    console.log(toolbox);
    return toolbox
  },

  runJS () {
    Blockly.JavaScript.INFINITE_LOOP_TRAP = '  checkTimeout();\n';
    /*var timeouts = 0;
    const checkTimeout = function() {
      if (timeouts++ > 1000000) {
        // throw MSG['timeout'];
      }
    };*/
    var code = Blockly.JavaScript.workspaceToCode(this.workspace);
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    try {
      console.log(code);
      eval(code);
    } 
    catch (e) {
      console.log(e);
    }
  },

  saveBlocks () {
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xml_text = Blockly.Xml.domToText(xml);
    this.data['xml'] = xml_text;
    this.data['code'] = Blockly.JavaScript.workspaceToCode(this.workspace);
  },

  getData () {
    this.saveBlocks()
    
    return this.data
  },

  getSavedBlocks (param) {
    var xml = Blockly.Xml.textToDom(param);
    console.log(param)
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
  },

  clear () {
    Blockly.mainWorkspace.clear()
  },

  resetSavedData () {
    this.data = {
      'xml': '',
      'array': '',
      'code': ''
    }
  },

  disposeEngine () {
    this.resetSavedData()
    this.clear()

    delete this
  },

  createBlocks () {
    Blockly.JavaScript['controls_whileUntil'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '\'\'';
      return 'while';
    };
    // networks

    // regular
    const data_regular  = {
      "type": "regular",
      "message0": 'Regular %1',
      "args0": [
        {"type": "input_value", "name": "VALUE", "check": "CPU"}
      ],
      "colour": 20,
      "tooltip": "Network type",
      "helpUrl": ""
    }
    Blockly.Blocks['regular'] = {
      init: function() {
        this.jsonInit(data_regular);
      }
    };
    Blockly.JavaScript['regular'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'Network - regular';
    };

    // repeater
    const data_repeater  = {
      "type": "repeater",
      "message0": 'RepeaterNode %1',
      "args0": [
        {"type": "input_value", "name": "VALUE", "check": "CPU"}
      ],
      "colour": 20,
      "tooltip": "Network type",
      "helpUrl": ""
    }
    Blockly.Blocks['repeater'] = {
      init: function() {
        this.jsonInit(data_repeater);
      }
    };
    
    Blockly.JavaScript['repeater'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '\'\'';
      return 'repeater';
    };

    // master_slave
    const data_master_slave  = {
      "type": "master_slave",
      "message0": 'Master %1 \n Slave %2',
      "args0": [
        {"type": "input_value", "name": "VALUE1", "check": "CPU"},
        {"type": "input_value", "name": "VALUE2", "check": "CPU"}
      ],
      "colour": 20,
      "tooltip": "Network type",
      "helpUrl": ""
    }
    Blockly.Blocks['master_slave'] = {
      init: function() {
        this.jsonInit(data_master_slave);
      }
    }

    Blockly.JavaScript['master_slave'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE1', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      Blockly.JavaScript.valueToCode(block, 'VALUE2', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'Network - master_slave';
    };

    // CPU's

    // ATmega328
    const data_ATmega328  = {
      "type": "CPU",
      "message0": 'ATmega328 %1',
      "args0": [
        {"type": "input_statement", "name": "CPU"}
      ],
      "output": "CPU",
      "colour": 50,
      "tooltip": "Type of CPU",
      "helpUrl": ""
    }
    Blockly.Blocks['ATmega328'] = {
      init: function() {
        this.jsonInit(data_ATmega328);
      }
    }

    Blockly.JavaScript['ATmega328'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'CPU', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'ATmega328';
    };

    // ATmega644
    const data_ATmega644  = {
      "type": "CPU",
      "message0": 'ATmega644 %1',
      "args0": [
        {"type": "input_statement", "name": "CPU1", "check": ["Boolean", "Array", "String", "Number"]}
      ],
      "output": "CPU",
      "colour": 50,
      "tooltip": "Type of CPU",
      "helpUrl": ""
    }
    Blockly.Blocks['ATmega644'] = {
      init: function() {
        this.jsonInit(data_ATmega644);
      }
    }
    Blockly.JavaScript['ATmega644'] = function() {
      // Blockly.JavaScript.valueToCode(block, 'CPU1', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return ['ATmega644', Blockly.JavaScript.ORDER_NONE];
    };
    
    // ATtiny85
    const data_ATtiny85  = {
      "type": "ATtiny85",
      "message0": 'ATtiny85 %1',
      "args0": [
        {"type": "input_statement", "name": "CPU"}
      ],
      "output": "CPU",
      "colour": 50,
      "tooltip": "Type of CPU",
      "helpUrl": ""
    }
    Blockly.Blocks['ATtiny85'] = {
      init: function() {
        this.jsonInit(data_ATtiny85);
      }
    }

    Blockly.JavaScript['ATtiny85'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'CPU', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'ATtiny85';
    };


    // COMPONENTS

    //HM-10
    const data_HM10  = {
      "type": "HM-10",
      "message0": 'HM-10 %1 %2 %3 %4 %5',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["ble.transmit_string", "transmit string"],
            ["ble.receive_string", "receive string"],
            ["ble.transmit_character", "transmit character"],
            ["ble.receive_character", "receive character"]
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"},
        {"type": "input_value", "name": "TIMES", "check": "Number"},
        {"type": "input_value", "name": "TIMES", "check": "Number"},
        {"type": "input_value", "name": "TIMES", "check": "Number"}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['HM-10'] = {
      init: function() {
        this.jsonInit(data_HM10);
      }
    };

    // PushButton
    const data_PushButton  = {
      "type": "PushButton",
      "message0": 'Push Button %1 %2',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["if_pressed", "if pressed"]
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"}
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['PushButton'] = {
      init: function() {
        this.jsonInit(data_PushButton);
      }
    };

    // Esp8266-12E3
    const data_Esp826612E3  = {
      "type": "Esp826612E3",
      "message0": 'Esp8266-12E3 %1 %2 %3',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["send_string", "send string"],
            ["attach_button", "attach button"],
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"},
        {"type": "input_value", "name": "TIMES", "check": "Number"},
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['Esp826612E3'] = {
      init: function() {
        this.jsonInit(data_Esp826612E3);
      }
    };

    // ArduCam-5MP
    const data_ArduCam5MP  = {
      "type": "ArduCam5MP",
      "message0": 'ArduCam-5MP %1 %2',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["video_capture", "video capture"],
            ["get_last_image", "get_last_image"],
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"},
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['ArduCam5MP'] = {
      init: function() {
        this.jsonInit(data_ArduCam5MP);
      }
    };

    // Timing
    const data_Timing  = {
      "type": "Timing",
      "message0": 'Timing %1 %2',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["time", "time"]
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"}
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['Timing'] = {
      init: function() {
        this.jsonInit(data_Timing);
      }
    };
    Blockly.JavaScript['Timing'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'CPU', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'Timing';
    };

    // IR
    const data_IR  = {
      "type": "IR",
      "message0": 'IR %1 %2',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["transmit", "transmit"]
          ]
        },
        {"type": "input_value", "name": "TIMES", "check": "Number"}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['IR'] = {
      init: function() {
        this.jsonInit(data_IR);
      }
    };
    Blockly.JavaScript['IR'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'IR';
    };

    // detector
    const data_detector  = {
      "type": "detector",
      "message0": 'detector %1',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["listen", "listen"]
          ]
        }
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['detector'] = {
      init: function() {
        this.jsonInit(data_detector);
      }
    };
    Blockly.JavaScript['detector'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'detector';
    };

    // sx1278_1
    const data_sx1278_1  = {
      "type": "sx1278_1",
      "message0": 'sx1278 %1',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["recieveIntr", "recieveIntr"]
          ]
        }
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['sx1278_1'] = {
      init: function() {
        this.jsonInit(data_sx1278_1);
      }
    };
    Blockly.JavaScript['sx1278_1'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'CPU', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'sx1278_1';
    };

    // temperature
    const data_temperature  = {
      "type": "temperature",
      "message0": 'temperature %1',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["temp", "temp"]
          ]
        }
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['temperature'] = {
      init: function() {
        this.jsonInit(data_temperature);
      }
    };
    Blockly.JavaScript['temperature'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'temperature';
    };

    // sx1278_1
    const data_sx1278_2  = {
      "type": "sx1278_2",
      "message0": 'sx1278 %1 %2 %3 %4 %5',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["send", "send"]
          ]
        },
        {"type": "input_value", "name": "TIMES1", "check": "String"},
        {"type": "input_value", "name": "TIMES2", "check": "Number"},
        {"type": "input_value", "name": "TIMES3", "check": "Number"},
        {"type": "input_value", "name": "TIMES4", "check": "Boolean"}
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['sx1278_2'] = {
      init: function() {
        this.jsonInit(data_sx1278_2);
      }
    };
    Blockly.JavaScript['sx1278_2'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'sx1278_2';
    };

    // cpu
    const data_cpu  = {
      "type": "cpu",
      "message0": 'CPU %1 %2 %3',
      "args0": [
        {
          "type": "field_dropdown",
          "name": "FUNCTION",
          "options": [
            ["sleep_mode", "sleep_mode"]
          ]
        },
        {"type": "input_value", "name": "TIMES1", "check": "Number"},
        {"type": "input_value", "name": "TIMES2", "check": "Number"}
      ],
      "output": "Boolean",
      "colour": 190,
      "tooltip": "What does this function",
      "helpUrl": ""
    }
    Blockly.Blocks['cpu'] = {
      init: function() {
        this.jsonInit(data_cpu);
      }
    };
    Blockly.JavaScript['cpu'] = function(block) {
      Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\'';
      return 'cpu';
    };

    /*
    'Built-in','CPU','ATmega328', [
      'Built-in','Control','when_do',[
        'Sensor','Push Button','BUTTON2.bell',[
          'Built-in','DataStr','pinArray',[3]]
        ], 
        ['Communication','Wifi','Esp8266-12E3.open_socket',[
          'Built-in','DataStr','pinArray',[3, 4]
        ],['Communication','Camera','ArduCam-5MP.video_streaming',[
            'Built-in','DataStr','pinArray',[6, 7, 8]]
          ],[
            'Communication','Camera','A20.listening',['Built-in','DataStr','pinArray',[3, 4, 5]
          ]
          ]
        ]
      ]
    */
  }
}