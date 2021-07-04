export default {
  // name: '',
  // package: '',
  dimensions: {
    min_body_range_e: '0.9',
    max_body_range_e: '1.1',
    min_body_width_d: '0.4',
    max_body_width_d: '0.6',
    min_body_width_t: '0.1',
    max_body_width_t: '0.3',
    maximum_height: '0.6',
    packageType: '0',
    polarity: '0'
  },
  package_heel: {
    smin: '',
    smax: '',
    isCalculated: false
  },
  solder_filters: {
    toe_filter: '',
    hill_filter: '',
    side_filter: '',
    board_density_level: '',
    isDefault: false},
  component_tolerances: {
    overall_width: '',
    heel_distance: '',
    lead_width: '',
    isCalculated: false},
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
    addCompLayer: '12'
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
