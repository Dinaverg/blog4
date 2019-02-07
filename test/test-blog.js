let chai = require('chai')
let chaiHttp = require('chai-http')
let faker = require('faker')
let mongoose = require('mongoose')

let expect = chai.expect

let {BlogPost} = require('../models')
let {app, runServer, closeServer} = require('../server');
let {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp)

function seedBlogData() {
    console.log('seeding blog data')
    let seedData = []
    for (let i=0; i<10; i++) {
        seedData.push(generateBlogData())
    }
    return BlogPost.insertMany(seedData)
}

function generateAuthorData() {
    return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        userName: faker.internet.userName()
    }
}

function generateBlogData() {
    return {
        title: faker.lorem.word(),
        content: faker.lorem.sentence(),
        created: faker.date.past(),
        author: generateAuthorData()
    }
}

function tearDownDb() {
    console.log('deleting database')
    return mongoose.connection.dropDatabase()
}

describe('Blog', function() {
    before(function() {
        return runServer(TEST_DATABASE_URL)
    })

    beforeEach(function() {
        return seedBlogData()
    })

    afterEach(function() {
        return tearDownDb()
    })

    after(function() {
        return closeServer()
    })

    describe('GET endpoint', function() {
        it('should return all blog posts', function() {
            let res
            return chai.request(app)
                .get('/posts')
                .then(function(_res) {
                    res = _res //not sure what this does...
                    expect(res).to.have.status(200)
                })
        })
    })
})