import assert from 'assert'
import { traverseDocument, ObjectId } from '../dist'

describe('Traverse document', () => {
  it('autocast deep MongoDB operators', async () => {
    const what = {
      items: {
        $elemMatch: {
          date: '2023-10-31T21:57:45.943Z',
          image: '653c3d448a707ef3d327f624',
          status: 'accepted',
        },
      },
    }

    const { result } = await traverseDocument(what, {
      $id: '',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                format: 'date-time',
              },
              image: {
                $ref: 'file',
              },
              status: {
                type: 'string',
              },
            },
          },
        },
      },
    }, {
      autoCast: true,
      allowOperators: true,
    })

    assert(result)
    assert(result.items.$elemMatch.date instanceof Date)
    assert(result.items.$elemMatch.image instanceof ObjectId)
    assert(result.items.$elemMatch.status === 'accepted')
  })

  it('autocast top-level MongoDB operators', async () => {
    const what = {
      $and: [
        {
          date: '2023-10-31T21:57:45.943Z',
        },
        {
          image: '653c3d448a707ef3d327f624',
        },
        {
          status: 'accepted',
        },
      ],
    }

    const { result } = await traverseDocument(what, {
      $id: '',
      properties: {
        date: {
          type: 'string',
          format: 'date-time',
        },
        image: {
          $ref: 'file',
        },
        status: {
          type: 'string',
        },
      },
    }, {
      autoCast: true,
      allowOperators: true,
    })

    assert(result)
    assert(result.$and[0].date instanceof Date)
    assert(result.$and[1].image instanceof ObjectId)
    assert(result.$and[2].status === 'accepted')
  })
})
