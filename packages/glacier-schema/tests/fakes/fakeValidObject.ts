export function fakeValidObject() {
  return {
    id: 123,
    name: 'John Doe',
    isActive: true,
    role: 'admin',
    status: 'active',
    meta: {
      created: '2023-01-01',
      updated: null
    },
    tags: ['developer', 'typescript'],
    scores: [95, 85, 75],
    preferences: {},
    settings: {
      debugmode: true,
      featureflag: false
    },
    unionExample: {
      type: 'A',
      value: 'Some string'
    },
    tupleExample: ['Hello', 42, true],
    setExample: [1, 2, 3],
    // Minimal object (no optional options)
    minimalObject: {},
    // Minimal array
    minimalArray: ['foo'],
    // Minimal string
    minimalString: 'bar',
    // Minimal number
    minimalNumber: 1.5,
    // Minimal integer
    minimalInteger: 2,
    // Minimal boolean
    minimalBoolean: false,
    // Minimal null
    minimalNull: null,
    // Minimal enum
    minimalEnum: 'A',
    // Minimal const
    minimalConst: 1,
    // Minimal set
    minimalSet: [1, 2],
    // Minimal tuple
    minimalTuple: ['baz'],
    // Minimal union
    minimalUnion: { foo: 'bar' },
    // Minimal map
    minimalMap: { key: 'value' }
  };
}
