import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(request, response) {
    const userId = request.user.id; // Assuming you have user information in the request

    const { name, type, parentId, isPublic, data } = request.body;

    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).send({ error: 'Missing or invalid type' });
    }
    if (!data && type !== 'folder') {
      return response.status(400).send({ error: 'Missing data' });
    }

    if (parentId !== undefined) {
      const parentFile = await dbClient.files.findOne({ _id: parentId });
      if (!parentFile) {
        return response.status(400).send({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return response.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, uuidv4());

    if (type !== 'folder') {
      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);
    }

    const newFile = {
      userId,
      name,
      type,
      isPublic: !!isPublic,
      parentId: parentId || 0,
      localPath: type !== 'folder' ? localPath : null,
    };

    const result = await dbClient.files.insertOne(newFile);

    newFile._id = result.insertedId;

    return response.status(201).send(newFile);
  }
}

export default FilesController;
