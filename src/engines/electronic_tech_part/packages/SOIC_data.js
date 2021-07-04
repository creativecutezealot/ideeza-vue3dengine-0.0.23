export default {
  // name: '',
  // package: '',
  dimensions: {
    min_width_range: '9.97',
    max_width_range: '10.63',
    pinNumber: '16',
    pitch_e: '1.27',
    bodyWidthRange_e_min: '7.4',
    bodyWidthRange_e_max: '7.6',
    bodyLengthRange_d_min: '10.1',
    bodyLengthRange_d_max: '10.5',
    maxHeightA: '2.65',
    minStandofHeight: '0.1',
    lead_width_b_min: '0.31',
    lead_width_b_max: '0.51',
    lead_length_l_min: '0.4',
    lead_length_l_max: '1.27'
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
