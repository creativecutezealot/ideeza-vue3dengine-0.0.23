export default {
  dimensions: {
    min_lead_span: '4.4',
    max_lead_span: '4.8',
    min_body_length: '4.1',
    max_body_length: '4.5',
    min_body_width: '4.1',
    max_body_width: '4.5',
    lead_length_min: '1.6',
    lead_length_max: '2',
    lead_width_min: '0.5',
    lead_width_max: '0.8',
    diameter_min: '3.5',
    diameter_max: '4.5',
    maxHeight: '6.3'
  },
  heel_spacing: {
    s_minimum: true,
    s_maximum: true,
    isCalculated: false
  },
  solder_filters: {
    isDefault: false,
    board_density_level: '',
    toe_filter: '',
    heel_filter: '',
    side_filter: ''
  },
  tolerance: {
    isCalculated: false,
    onOverallWidth: 0,
    onInnerDistance: 0,
    onWidth: 0
  },
  ipc: {
    isDefault: false,
    accuracyPCB: '',
    accuracyAssembly: '',
    courtyard: ''
  },
  footprint: {
    isCalculated: false,
    x: '',
    y: '',
    c: '',
    pad_shape: ''
  },
  silkscreen: {
    isCalculated: true,
    LineWidth: '0.1',
    r1: '',
    r2: ''
  },
  courtyard: {
    isCourtyardCalculated: false,
    useCourtYardInfo: false,
    isAssemblyCalculated: false,
    addAssemblyInfo: false,
    addCompBodyInfo: true,
    isCompBodyCalculated: false,
    courtV1: '11.5',
    courtV1LineWidth: '0.5',
    courtV2: '11.5',
    courtV2layer: '1',
    assemblyA: '11.5',
    assemblyALineWidth: '0.5',
    assemblyB: '11.5',
    assemblyBlayer: '1',
    addCompWidth: '11.5',
    addCompLength: '0.5',
    addCompLayer: '1'
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
