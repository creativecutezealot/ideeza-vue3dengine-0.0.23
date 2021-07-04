export default {
  hasValue: false,
  value: '',
  package: 'R0805',
  isClockwise: false,
  name: '',
  name2d: '',
  nameFontSize: 0,
  legs: 2,
  PinStartAt: 1,
  dimensions: {
    t_min_bandwidth: '0',
    t_max_bandwidth: '0.5',
    tw_min_bandwidth: '0',
    tw_max_bandwidth: '1.2',
    min_body_width_w: '0',
    max_body_width_w: '1.2',
    min_body_length_l: '0',
    max_body_length_l: '1',
    pin_location: '0',
    maximum_height: '0.5',
    package_type: '0'
  },
  package_heel: {smin: '', smax: '', isCalculated: false},
  solder_filters: {toe_filter: '', hill_filter: '', side_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {overall_width: '', heel_distance: '', lead_width: '', isCalculated: false},
  IPC_tolerances: {fabrication: '', placement: '', courtyard: '', isDefault: false},
  footprint_dimension: {x: '', y: '', c: '', isCalculated: false},
  silkscreen: {
    isCalculated: true, //
    LineWidth: 0.05, //
    r1: 7, //
    r2: 7 //
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
