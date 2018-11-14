export default function (kibana) {
  return new kibana.Plugin({
    require: [],
    name: 'xpack_main',
    id: 'xpack_main',
    configPrefix: 'xpack.xpack_main',
    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        xpack_api_polling_frequency_millis: Joi.number().default(30000),
      }).default();
    },
    init() {
      console.log('FAKE X-PACK IN FULL EFFECT! [xpack_main]');
    },
  });
}
