export default {
  // name: '',
  // package: '',
  dimensions: {
    min_body_width_e1: '4.05',
    max_body_width_e1: '4.6',
    min_body_length_d: '3.3',
    max_body_length_d: '3.95',
    min_lead_length_l: '0.75',
    max_lead_length_l: '1.5',
    min_lead_span_e: '5.1',
    max_lead_span_e: '5.6',
    min_lead_width_b: '1.95',
    max_lead_width_b: '2.2',
    maximum_height: '0.8'
  },
  package_heel: {smin: '3.1', smax: '3.467', isCalculated: false},
  solder_filters: {side_filter: '', toe_filter: '', heel_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {overall_width: '', heel_distance: '', lead_width: '', isCalculated: false},
  footprint_dimension: {x: '', y: '', c: '', pad_shape: '', isCalculated: false},
  silkscreen: {
    isCalculated: false,
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
  IPC_tolerances: {
    fabrication: '',
    assembly: '',
    courtyard: '',
    isDefault: false
  }
}
