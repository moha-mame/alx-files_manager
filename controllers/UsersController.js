import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });

    try {
      const emailExists = await dbClient.users.findOne({ email });
      if (emailExists) return response.status(400).send({ error: 'Already exist' });

      const sha1Password = sha1(password);

      const result = await dbClient.users.insertOne({
        email,
        password: sha1Password,
      });

      const user = {
        id: result.insertedId.toString(),
        email,
      };

      await userQueue.add({
        userId: user.id,
      });

      return response.status(201).send(user);
    } catch (error) {
      return response.status(500).send({ error: 'Error creating user' });
    }
  }
  
}

export default UsersController;
