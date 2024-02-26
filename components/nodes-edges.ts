const position = { x: 0, y: 0 }
const edgeType = 'smoothstep'

export const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'input' },
    position
  },
  {
    id: '2',
    data: { label: 'node 2' },
    position
  },
  {
    id: '2a',
    data: { label: 'node 2a' },
    position
  },
  {
    id: '2b',
    data: { label: 'node 2b' },
    position
  },
  {
    id: '2c',
    data: { label: 'node 2c' },
    position
  },
  {
    id: '2d',
    data: { label: 'node 2d' },
    position
  },
  {
    id: '3',
    data: { label: 'node 3' },
    position
  },
  {
    id: '4',
    data: { label: 'node 4' },
    position
  },
  {
    id: '5',
    data: { label: 'node 5' },
    position
  },
  {
    id: '6',
    type: 'output',
    data: { label: 'output' },
    position
  },
  { id: '7', type: 'output', data: { label: 'output' }, position }
]

export const initialEdges = [
  { id: 'e12', source: '1', target: '2', type: edgeType, animated: true },
  { id: 'e13', source: '1', target: '3', type: edgeType, animated: true },
  { id: 'e22a', source: '2', target: '2a', type: edgeType, animated: true },
  { id: 'e22b', source: '2', target: '2b', type: edgeType, animated: true },
  { id: 'e22c', source: '2', target: '2c', type: edgeType, animated: true },
  { id: 'e2c2d', source: '2c', target: '2d', type: edgeType, animated: true },
  { id: 'e45', source: '4', target: '5', type: edgeType, animated: true },
  { id: 'e56', source: '5', target: '6', type: edgeType, animated: true },
  { id: 'e57', source: '5', target: '7', type: edgeType, animated: true }
]

// // State management for nodes and edges using React Flow's hooks
// const initialNodes: Node<{ label: string }, string | undefined>[] = [
//   {
//     id: '1',
//     type: 'input',
//     data: { label: 'Node 0' },
//     position: { x: 250, y: 5 },
//     className: 'light'
//   },
//   {
//     id: '2',
//     data: { label: 'Group A' },
//     position: { x: 100, y: 100 },
//     className: 'light',
//     style: {
//       backgroundColor: 'rgba(255, 0, 0, 0.2)',
//       width: 200,
//       height: 200
//     }
//   },
//   {
//     id: '2a',
//     data: { label: 'Node A.1' },
//     position: { x: 10, y: 50 },
//     parentNode: '2'
//   },
//   {
//     id: '3',
//     data: { label: 'Node 1' },
//     position: { x: 320, y: 100 },
//     className: 'light'
//   },
//   {
//     id: '4',
//     data: { label: 'Group B' },
//     position: { x: 320, y: 200 },
//     className: 'light',
//     style: {
//       backgroundColor: 'rgba(255, 0, 0, 0.2)',
//       width: 300,
//       height: 300
//     },
//     type: 'group'
//   },
//   {
//     id: '4a',
//     data: { label: 'Node B.1' },
//     position: { x: 15, y: 65 },
//     className: 'light',
//     parentNode: '4',
//     extent: 'parent' as const
//   },
//   {
//     id: '4b',
//     data: { label: 'Group B.A' },
//     position: { x: 15, y: 120 },
//     className: 'light',
//     style: {
//       backgroundColor: 'rgba(255, 0, 255, 0.2)',
//       height: 150,
//       width: 270
//     },
//     parentNode: '4'
//   },
//   {
//     id: '4b1',
//     data: { label: 'Node B.A.1' },
//     position: { x: 20, y: 40 },
//     className: 'light',
//     parentNode: '4b'
//   },
//   {
//     id: '4b2',
//     data: { label: 'Node B.A.2' },
//     position: { x: 100, y: 100 },
//     className: 'light',
//     parentNode: '4b'
//   }
// ]

// const initialEdges = [
//   { id: 'e1-2', source: '1', target: '2', animated: true },
//   { id: 'e1-3', source: '1', target: '3' },
//   { id: 'e2a-4a', source: '2a', target: '4a' },
//   { id: 'e3-4b', source: '3', target: '4b' },
//   { id: 'e4a-4b1', source: '4a', target: '4b1' },
//   { id: 'e4a-4b2', source: '4a', target: '4b2' },
//   { id: 'e4b1-4b2', source: '4b1', target: '4b2' }
// ]

const nodeBank = [
  {
    id: '11',
    data: {
      label: '#ffc800',
      color: '#ffc800'
    },
    position: { x: 0, y: 0 }
  },
  {
    id: '12',
    data: {
      label: '#6865A5',
      color: '#6865A5'
    },
    position: { x: 150, y: 0 }
  },
  {
    id: '13',
    data: {
      label: '#ff6700',
      color: '#ff6700'
    },
    position: { x: 50, y: 100 }
  },
  {
    id: '14',
    data: {
      label: '#0041d0',
      color: '#0041d0'
    },
    position: { x: 200, y: 100 }
  },
  {
    id: '15',
    data: {
      label: '#ff0072',
      color: '#ff0072'
    },
    position: { x: 0, y: 200 }
  },
  {
    id: '16',
    data: {
      label: '#00d7ca',
      color: '#00d7ca'
    },
    position: { x: 150, y: 200 }
  },
  {
    id: '17',
    data: {
      label: '#6ede87',
      color: '#6ede87'
    },
    position: { x: 50, y: 300 }
  },
  {
    id: '18',
    data: {
      label: '#9ca8b3',
      color: '#9ca8b3'
    },
    position: { x: 200, y: 300 }
  }
]

const testBackendData = {
  data: {
    recommendation: [
      {
        id: 0,
        text: 'coenzyme Q10 and Disorders.'
      },
      {
        id: 1,
        text: 'coenzyme Q10 and Genes & Molecular Sequences.'
      },
      {
        id: 2,
        text: 'coenzyme Q10 and Chemicals & Drugs.'
      },
      {
        id: 3,
        text: 'coenzyme Q10 and Physiology.'
      },
      {
        id: 4,
        text: 'coenzyme Q10 and Living Beings.'
      },
      {
        id: 5,
        text: 'coenzyme Q10 and Anatomy.'
      },
      {
        id: 6,
        text: 'coenzyme Q10 and Dietary Supplement.'
      }
    ],
    vis_res: [
      {
        edges: [
          {
            PubMed_ID: '23221577 | 31687097',
            Relation_ID: 0,
            Source: 0,
            Target: 1,
            Type: 'ASSOCIATED_WITH'
          },
          {
            PubMed_ID: '23221577',
            Relation_ID: 1,
            Source: 0,
            Target: 1,
            Type: 'AFFECTS'
          }
        ],
        nodes: [
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          },
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          },
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          }
        ]
      },
      {
        edges: [
          {
            PubMed_ID: '24593795',
            Relation_ID: 2,
            Source: 0,
            Target: 2,
            Type: 'TREATS'
          }
        ],
        nodes: [
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          }
        ]
      },
      {
        edges: [
          {
            PubMed_ID: '22005267 | 26232096',
            Relation_ID: 3,
            Source: 3,
            Target: 2,
            Type: 'AFFECTS'
          }
        ],
        nodes: [
          {
            CUI: 'C0920563',
            Label: 'Disorders',
            Name: 'Insulin Sensitivity',
            Node_ID: 3
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          },
          {
            CUI: 'C0920563',
            Label: 'Disorders',
            Name: 'Insulin Sensitivity',
            Node_ID: 3
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          }
        ]
      }
    ]
  },
  message: 'Chat session retrieved/created successfully',
  status: 'success'
}
