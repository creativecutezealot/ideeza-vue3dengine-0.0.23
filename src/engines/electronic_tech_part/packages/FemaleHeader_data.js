export default {
  hasValue: false,
  value: '',
  isClockwise: false,
  option: '',
  name: '',
  name2d: '',
  nameFontSize: 0,
  package: 'Female Header',
  PinStartAt: 1,
  dimensions: {
    pinNumber: '10',
    d_min_body_span: 0,
    d_max_body_span: 2.54,
    e_min_body_span: 0,
    e_max_body_span: 25.4,
    maximum_height: 8.5,
    pin_location: 0
  },
  package_pin: {
    min_lead_length: 0,
    max_lead_length: 0.4,
    min_lead_width: 0,
    max_lead_width: 0.6,
    e_pitch: 2.54,
    e1_pitch: 2.54,
    min_lead_height: 0,
    max_lead_height: 2,
    max_lead_height90: 2.5,
    e_number_pins: 10,
    d_number_pins: 1,
    type: 0
  },
  package_thermal_pad: {
    pin_location: true,
    e2_min_thermal_range: '',
    e2_max_thermal_range: '',
    d2_min_thermal_range: '',
    d2_max_thermal_range: ''
  },
  package_heel: {semin: '', semax: '', sdmin: '', sdmax: '', isCalculated: false},
  solder_filters: {toe_filter: '', side_filter: '', heel_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {d_overall_width: '', e_overall_width: '', d_heel_distance: '', e_heel_distance: '', lead_width: '', isCalculated: false},
  IPC_tolerances: {
    fabrication: '',
    assembly: '',
    courtyard: '',
    isDefault: false
  },
  footprint_dimension: {x: '', y: '', c1: '', c2: '', isCalculated: false},
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
    addCompLayer: '12'
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}
