const assert = require("assert")
const api = require("./../api")

let app = {}

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Inh1eGFkYXNpbHZhIiwiaWQiOjEsImlhdCI6MTU2ODI5NTE1OH0.uzp_cQa9V7EH7J19DiMPoAKd_00yB9m2ZOtvOQnA0k4'
const headers = {
    authorization: TOKEN
}

const MOCK_HEROI_CADASTRAR = {
    nome: "Chapolin",
    poder: "Marreta Biônica"
}

const MOCK_HEROI_INICIAL = {
    nome: "Gavião Negro",
    poder: "Flechas"
}

let MOCK_ID = ""

describe("Suite de Testes da API Heroes", function() {
    this.beforeAll(async () => {
        app = await api

        const result = await app.inject({
            method: "POST",
            url: "/herois",
            headers,
            payload: JSON.stringify(MOCK_HEROI_INICIAL)
        })
        const dados = JSON.parse(result.payload)
        MOCK_ID = dados._id
    })

    it("listar /herois", async () => {
        const result = await app.inject({
            method: "GET",
            headers,
            url: "/herois?skip=0&limit=10"
        })

        const dados = JSON.parse(result.payload)
        const statusCode = result.statusCode

        assert.deepEqual(statusCode, 200)
        assert.ok(Array.isArray(dados))
    })

    it("retornar 10 registros apenas no /herois", async () => {
        const TAMANHO_LIMITE = 3
        const result = await app.inject({
            method: "GET",
            headers,
            url: `/herois?skip=0&limit=${TAMANHO_LIMITE}`
        })

        const dados = JSON.parse(result.payload)
        const statusCode = result.statusCode
        assert.deepEqual(statusCode, 200)
        assert.ok(dados.length === TAMANHO_LIMITE)
    })

    it("retornar um erro com limit incorreto", async () => {
        const TAMANHO_LIMITE = "AEA"
        const result = await app.inject({
            method: "GET",
            headers,
            url: `/herois?skip=0&limit=${TAMANHO_LIMITE}`
        })

        const errorResult = {
            statusCode: 400,
            error: "Bad Request",
            message: 'child "limit" fails because ["limit" must be a number]',
            validation: { source: "query", keys: ["limit"] }
        }

        assert.deepEqual(result.statusCode, 400)
        assert.deepEqual(result.payload, JSON.stringify(errorResult))
    })

    it("filtar um item no /herois", async () => {
        const NAME = MOCK_HEROI_INICIAL.nome
        const result = await app.inject({
            method: "GET",
            headers,
            url: `/herois?skip=0&limit=1000&nome=${NAME}`
        })

        const dados = JSON.parse(result.payload)
        const statusCode = result.statusCode
        assert.deepEqual(statusCode, 200)
        assert.ok(dados[0].nome, NAME)
    })

    it("cadastrar herois", async () => {
        const result = await app.inject({
            method: "POST",
            url: "/herois",
            headers,
            payload: JSON.stringify(MOCK_HEROI_CADASTRAR)
        })

        const statusCode = result.statusCode
        const { message, _id } = JSON.parse(result.payload)

        assert.ok(statusCode === 200)
        assert.notStrictEqual(_id, undefined)
        assert.deepEqual(message, "Herói cadastrado com sucesso")
    })

    it("atualizar", async () => {
        const _id = MOCK_ID
        const expected = {
            poder: "Super Mira"
        }

        const result = await app.inject({
            method: "PATCH",
            url: `/herois/${_id}`,
            headers,
            payload: JSON.stringify(expected)
        })

        const statusCode = result.statusCode
        const dados = JSON.parse(result.payload)

        assert.ok(statusCode === 200)
        assert.deepEqual(dados.message, "Herói atualizado com sucesso")
    })

    it("não deve atualizar com id incorreto", async () => {
        const _id = "5d75278789eb810ebc6a713a"

        const result = await app.inject({
            method: "PATCH",
            url: `/herois/${_id}`,
            headers,
            payload: JSON.stringify({poder: "Super Mira"})
        })

        const statusCode = result.statusCode
        const dados = JSON.parse(result.payload)

        const expected = {
            statusCode: 412,
            error: 'Precondition Failed',
            message: 'ID não encontrado no banco'
        }

        assert.ok(statusCode === 412)
        assert.deepEqual(dados, expected)
    })

    it("remover", async () => {
        const _id = MOCK_ID
        const result = await app.inject({
            method: "DELETE",
            headers,
            url: `/herois/${_id}`
        })
        const statusCode = result.statusCode
        const dados = JSON.parse(result.payload)

        assert.ok(statusCode === 200)
        assert.deepEqual(dados.message, "Herói removido com sucesso")
    })

    it("não deve remover", async () => {
        const _id = "5d75278789eb810ebc6a713a"
        const result = await app.inject({
            method: "DELETE",
            headers,
            url: `/herois/${_id}`
        })
        const statusCode = result.statusCode
        const dados = JSON.parse(result.payload)

        const expected = {
            statusCode: 412,
            error: 'Precondition Failed',
            message: 'ID não encontrado no banco'
        }

        assert.ok(statusCode === 412)
        assert.deepEqual(dados, expected)
    })

    it("não deve remover com ID inválido", async () => {
        const _id = "ID_INVALIDO"
        const result = await app.inject({
            method: "DELETE",
            headers,
            url: `/herois/${_id}`
        })
        const statusCode = result.statusCode
        const dados = JSON.parse(result.payload)

        const expected = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
        }

        assert.ok(statusCode === 500)
        assert.deepEqual(dados, expected)
    })
})
