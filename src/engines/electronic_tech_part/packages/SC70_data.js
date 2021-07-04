export default {
  // name: '',
  // package: '',
  dimensions: {
    bodyWidthRange_e1_min: '1.15',
    bodyWidthRange_e1_max: '1.35',
    maxHeightA: '1',
    bodyLengthRange_d_min: '1.80',
    bodyLengthRange_d_max: '2.20',
    minStandoffHeight: '0.1',
    packageType: '6'
  },
  package_pin: {
    lead_width_b_min: '0.15',
    lead_width_b_max: '0.3',
    pitch_e: '0.65',
    lead_span_e_min: '1.8',
    lead_span_e_max: '2.4',
    lead_length_l_min: '0.4',
    lead_length_l_max: '0.5',
    pitch_e1: '1.9'
  },
  package_heel: {
    smin: '',
    smax: '',
    useCalculated: false
  },
  round_off: {
    pitch: '',
    isDefault: false
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
    large_lead_width: '',
    small_lead_width: '',
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
    layer: ''
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
