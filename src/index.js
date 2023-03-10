const express = require('express');
const { v4: uuid } = require('uuid');

const customers = [];

// MiddleWare
function verifyIfCPFAlreadyExists(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "customer not found"});
    }
    else{
        request.customer = customer;
        return next();
    }
}

const app = express();

app.use(express.json());

app.post('/account', (request, response) => {
    const { cpf, name } = request.body;
    const id = uuid();

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    if(customerAlreadyExists){
        response.status(400).send({
            error: "Customer with this CPF already exists"
        })
    }

    customers.push({
        cpf,
        name,
        id,
        statement: []
    });

    response.status(201).send();
})

app.get('/statement', verifyIfCPFAlreadyExists, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
})

app.post('/deposit', verifyIfCPFAlreadyExists, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return response.status(201).send();
})

app.listen(3000);