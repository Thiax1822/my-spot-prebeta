import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.json());


const withDB = async (operations, res) => {
		try {
	
		const client = await MongoClient.connect('mongodb://localhost:27017', {useUnifiedTopology: true, useNewUrlParser: true} );
		const db = client.db('my-spot-prebeta');
		
		await operations(db);
		
		client.close();
		
	}
	catch (error){
		res.status(500).json({ message: 'Error connecting to db concha',error});
	}
	
}
app.get('/api/spots/:name', async (req, res) => {
	
		withDB(async (db) => {
			const spotName = req.params.name;
	
		
		const spotInfo = await db.collection('spots').findOne({name: spotName});
		res.status(200).json(spotInfo);
			
			
		}, res);
		

});
app.post('/api/spots/:name/likes', async (req,res) => {
	withDB(async (db) => {
				const spotName = req.params.name;
	
	const spotInfo = await db.collection('spots').findOne({name : spotName});
	await db.collection('spots').updateOne({ name:spotName},{
		'$set': {
			likes: spotInfo.likes + 1,
		},
		
	});
	
	const updatedSpotInfo = await db.collection('spots').findOne({name : spotName});
	res.status(200).json(updatedSpotInfo);
		
	}, res);
	
});



app.post('/api/spots/:name/add-comment', (req, res) => {
	
	const { username, text } = req.body;
	const spotName = req.params.name;
	
	withDB(async (db) => {
		const spotInfo = await db.collection('spots').findOne({ name: spotName });
		await db.collection('spots').updateOne({name:spotName}, {
			'$set':{
				comments: spotInfo.comments.concat({username, text}),
			},
			
		});
		const updatedSpotInfo = await db.collection('spots').findOne({ name:spotName});
		res.status(200).json(updatedSpotInfo);
	}, res);
	
});
app.get('*',(req,res) => {
	res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('atendiendo puerto 8000'));
