export default {
  // name: '',
  // package: '',
  dimensions: {
    min_body_range_e: '0.95',
    max_body_range_e: '2.05',
    min_body_range_d: '0.55',
    max_body_range_d: '1.65',
    maxHeight: '0.35',
    maxStandHeight: '0'
  },
  package_pin: {
    b1_body_width_min: '0.5',
    b1_body_width_max: '0.475',
    l1_body_width_min: '0.4',
    l1_body_width_max: '0.575',
    e1_pitch: '0.5',
    e2_pitch: '0.7'
  },
  solder_filters: {periphery: '', board_density_level: '', isCalculated: false},
  component_tolerances: {overall_width: '', heel_distance: '', lead_width: '', isDefault: false},
  footprint_dimension: {x1: '', y1: '', x2: '', y2: '', c1: '', c2: '', c: '', shape: '', isCalculated: false},
  silkscreen: {
    isCalculated: true,
    LineWidth: 0.05,
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
