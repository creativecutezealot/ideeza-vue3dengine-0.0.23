export default {
  // name: '',
  // package: '',
  dimensions: {
    pinNumber: '4',
    bodyWidthRange_e1_min: '10',
    bodyWidthRange_e1_max: '10.45',
    maxHeightA: '1.5',
    minStandofHeight: '0.1',
    bodyLengthRange_e1_min: '9',
    bodyLengthRange_e1_max: '9.14'
  },
  package_pin: {
    lead_width_b_min: '0.31',
    lead_width_b_max: '0.94',
    lead_width_b2_min: '9',
    lead_width_b2_max: '9',
    lead_width_l_min: '0.4', 
    lead_width_l_max: '6.7',
    pitch: '2.3',
    lead_span_min: '7.8',
    lead_span_max: '7.8',
    lead_span2_min: '9',
    lead_span2_max: '9',
    lead_span3_max: '1.27',
    leadNumber: '4'
  },
  thermal_dimensions: { 
    thermalPadRange_e2_min: '',
    thermalPadRange_e2_max: '',
    thermalPadRange_d2_min: '',
    thermalPadRange_d2_max: '',
    add: false
  },
  package_heel: {
    smin: '',
    smax: '',
    useCalculated: false
  },
  solder_filters: {
    toe_filter: '',
    hill_filter: '',
    side_filter: '',
    board_density_level: '',
    isDefault: false
  },
  component_tolerances: {
    overall_width: '',
    heel_distance: '',
    widthComponentLead: '',
    useCalculated: false
  },
  ipc_tolerances: {
    fabrication: '',
    placement: '',
    courtyard: '',
    isDefault: false
  },
  footprint_dimension: {
    x: '',
    y: '',
    c: '',
    shape: '',
    useCalculated: false
  },
  silkscreen: {
    useCalculated: false,
    LineWidth: '0.1',
    r1: '7',
    r2: '7'
  },
  courtyard: {
    isCourtyardCalculated: false,
    isAssemblyCalculated: false,
    isCompBodyCalculated: false,
    addCourtYardInfo: false,
    addAssemblyInfo: true,
    addCompBodyInfo: true,
    useCalculated: false,
    useCalculated2: '',
    useCalculated3: '',
    courtV1: '11.5',
    courtV1LineWidth: '0.5',
    courtV2: '11.5',
    courtV2layer: '1',
    courtA: '',
    courtAlayer: '',
    courtB: '',
    courtBLayer: '',
    width: '',
    length: '',
    layer: '',
    courtAlineWidth: ''
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
