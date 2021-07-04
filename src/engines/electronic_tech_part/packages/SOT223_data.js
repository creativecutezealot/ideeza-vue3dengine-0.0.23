export default {
  // name: '',
  // package: '',
  dimensions: {
    bodyWidthRange_e1_min: '3.3',
    bodyWidthRange_e1_max: '3.7',
    maxHeightA: '1.8',
    minStandofHeight: '0.02',
    bodyLengthRange_e1_min: '6.3',
    bodyLengthRange_e1_max: '6.7'
  },
  package_pin: {
    lead_width_b_min: '0.6',
    lead_width_b_max: '0.88',
    lead_width_b2_min: '2.9',
    lead_width_b2_max: '3.18',
    lead_width_l_min: '0.9',
    lead_width_l_max: '1.3',
    pitch: '2.3',
    lead_span_min: '6.7',
    lead_span_max: '7.3',
    overallPitch: '4.6',
    leadNumber: '5'
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
    thermalPad_width: '',
    useCalculated: false,
    small_leads: '',
    large_leads: ''
  },
  ipc_tolerances: {
    fabrication: '',
    placement: '',
    courtyard: '',
    isDefault: false
  },
  footprint_dimension: {
    x: '',
    x2: '',
    y: '',
    c: '',
    useCalculated: false
  },
  silkscreen: {
    useCalculated: true,
    LineWidth: '0.1',
    r1: '',
    r2: ''
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
    layer: ''
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
