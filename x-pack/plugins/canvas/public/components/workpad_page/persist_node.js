// surely there's a better way
import { SavedObjectsClient } from '../../../../../../src/ui/public/saved_objects/saved_objects_client.js';
import { SavedObject } from '../../../../../../src/ui/public/saved_objects/saved_object.js';

export default function a() {
  console.log('saving');
  const type = 'canvas'
  const savedObjectsClient = new SavedObjectsClient();
  const promise = savedObjectsClient.create(
    type,
    {
      enabled: true,
    },
    {
      id: 'monfera',
      overwrite: true,
    }
  );
  promise
    .then(data => {
      console.log('successful save!', data);
      return savedObjectsClient.get(type, 'monfera')
    })
    .then(savedObject => {
      debugger;
      console.log('successful read!', savedObject);
    })
    .catch((...args) => {
      debugger;
      console.log(args);
    });
}
