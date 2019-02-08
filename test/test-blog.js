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
                expect(res.body).to.have.lengthOf.at.least(1)
                return BlogPost.count()
            })
            .then(function(count) {
                expect(res.body).to.have.lengthOf(count)
            })
        })

        it('should return blogposts with the right fields', function() {
            let resBlogPost
            return chai.request(app)
            .get('/posts')
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res).to.be.json
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf.at.least(1)
                res.body.forEach(function(blogpost) {
                    expect(blogpost).to.be.an('object')
                    expect(blogpost).to.include.keys('title', 'content', 'created', 'author', 'id')
                })
                resBlogPost = res.body[0]
                return BlogPost.findById(resBlogPost.id)
            })
            .then(function(blogpost) {
                expect(resBlogPost.id).to.equal(blogpost.id)
                expect(resBlogPost.title).to.equal(blogpost.title)
                expect(resBlogPost.content).to.equal(blogpost.content)
                expect(resBlogPost.author).to.equal(`${blogpost.author.firstName} ${blogpost.author.lastName}`)
            })
        })
    })

    describe('POST endpoint', function() {
        it('should add a new blogpost', function() {
            let newBlogPost = generateBlogData()
            return chai.request(app)
            .post('/posts').send(newBlogPost)
            .then(function(res) {
                expect(res).to.have.status(201)
                expect(res).to.be.json
                expect(res.body).to.be.an('object')
                expect(res.body).to.include.keys('title', 'content', 'created', 'author', 'id')
                expect(res.body.title).to.equal(newBlogPost.title)
                expect(res.body.content).to.equal(newBlogPost.content)
                expect(res.id).to.not.be.null
                //ready to remove these if they cause problems
                expect(res.body.author).to.equal(`${newBlogPost.author.firstName} ${newBlogPost.author.lastName}`)
                return BlogPost.findById(res.body.id)
            })
            .then(function(blogpost) {
                expect(blogpost.title).to.equal(newBlogPost.title)
                expect(blogpost.content).to.equal(newBlogPost.content)
            })
        })
    })

    describe('PUT endpoint', function() {
        it('should upadte fields you send over', function() {
            let updateData = {
                title: 'Kumquat',
                content: 'Also known as the magical fruit...'
            }
            return BlogPost.findOne()
            .then(function(blogpost) {
                updateData.id = blogpost.id
                return chai.request(app)
                .put(`/posts/${blogpost.id}`)
                .send(updateData)
            })
            .then(function(res) {
                expect(res).to.have.status(204)
                return BlogPost.findById(updateData.id)
            })
            .then(function(blogpost) {
                expect(blogpost.title).to.eq(updateData.title)
                expect(blogpost.content).to.eq(updateData.content)
            })
        })
    })

    describe('DELETE endpoint', function() {
        it('delete a blogpost by id', function() {
            let blogpost
            return BlogPost.findOne()
            .then(function(_blogpost) {
                blogpost = _blogpost
                return chai.request(app).delete(`/posts/${blogpost.id}`)
            })
            .then(function(res) {
                expect(res).to.have.status(204)
                return BlogPost.findById(blogpost.id)
            })
            .then(function(_blogpost) {
                expect(_blogpost).to.be.null
            })
        })
    })
})