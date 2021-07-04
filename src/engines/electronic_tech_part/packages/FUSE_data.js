export default {
  // name: '',
  // package: '',
  dimensions: {
    min_bandwidth_t: '0.41',
    max_bandwidth_t: '0.3',
    min_body_width_w: '1.6',
    max_body_width_w: '1.7',
    min_body_length_l: '3.3',
    max_body_length_l: '3.7',
    pitch_e: '6.0',
    pin_location: '0',
    package_type: '0'
  },
  package_heel: {smin: '', smax: '', isCalculated: false},
  solder_filters: {toe_filter: '', hill_filter: '', side_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {overall_width: '', lead_width: '', heel_distance: '', isCalculated: false},
  IPC_tolerances: {fabrication: '', placement: '', courtyard: '', isDefault: false},
  footprint_dimension: {x: '', y: '', c: '', isCalculated: false},
  silkscreen: {
    isCalculated: true,
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
