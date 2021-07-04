export default {
  // name: '',
  // package: '',
  dimensions: {
    d_min_body_span: '9.8',
    d_max_body_span: '10.2',
    min_standoff: '0',
    maximum_height: '1.2',
    number_of_pins: '128',
    isCalculated: true,
    PinCountEOut: '16',
    PinCountDOut: '20',
    PinCountEIn: '16',
    PinCountDIn: '12'
  },
  package_pin: {
    add_thermal: true,
    min_lead_width: '0.25',
    max_lead_width: '0.33',
    min_lead_length: '0.4',
    max_lead_length: '0.6',
    d2_min_thermal_range: '4.04',
    d2_max_thermal_range: '4.24',
    e_pitch: '0.5',
    e1_pitch: '1'
  },
  package_heel: {smin: '', smax: '', isCalculated: false},
  solder_filters: {side_filter: '', toe_filter: '', heel_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {overall_width: '', heel_distance: '', lead_width: '', isCalculated: false},
  footprint_dimension: {x1: '', y1: '', c1: '', x2: '', y2: '', c2: '', pad_shape: '', isCalculated: false},
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
  IPC_tolerances: {
    fabrication: '',
    assembly: '',
    courtyard: '',
    isDefault: false
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
