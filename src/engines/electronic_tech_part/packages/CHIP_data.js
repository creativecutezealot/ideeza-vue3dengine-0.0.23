export default {
  // name: '',
  // package: '',
  dimensions: {
    min_body_span_e: '1.4',
    max_body_span_e: '1.8',
    min_body_span_d: '3.05',
    max_body_span_d: '3.35',
    maximum_height: '1',
    hullside: '0'
  },
  package_pin: {
    lead_width_min: '0.25',
    lead_width_max: '0.95',
    pitch: '1.27',
    number_of_pins: '8',
    lead_length_min: '0.3',
    lead_length_max: '0.5'
  },
  package_heel: {
    smax: '',
    isCalculated: false
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
    lead_width: '',
    isCalculated: false
  },
  IPC_tolerances: {
    fabrication: '',
    assembly: '',
    courtyard: '',
    isDefault: false
  },
  footprint_dimension: {
    x: '',
    y: '',
    c: '',
    shape: '',
    isCalculated: false
  },
  silkscreen: {
    isCalculated: true,
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
