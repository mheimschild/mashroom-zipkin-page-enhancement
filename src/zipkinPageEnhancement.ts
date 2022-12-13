import {Annotation, BatchRecorder, ExplicitContext, jsonEncoder, Tracer} from "zipkin";
import {HttpLogger} from 'zipkin-transport-http'

type ServicePatternsType = { [key: string]: string };
type ServiceRegexpType = { [key: string]: RegExp };
const createRegexFromMap = (servicePatterns: ServicePatternsType): ServiceRegexpType => {
  return Object.entries(servicePatterns).reduce((a, i) => {
    const [key, value] = i;

    return {
      ...a,
      [key]: new RegExp(value),
    };
  }, {});
}

const getServiceByRegexp = (url: string, serviceRegexp: ServiceRegexpType) => {
  const res = Object.entries(serviceRegexp).find(([_, value]) => !!value.exec(url));

  if (res) {
    return res[0];
  }
}

(window as any).__initZipkinWrapper__ = function(tracerUrl: string, servicePatterns: ServicePatternsType) {
  const serviceRegexp = createRegexFromMap(servicePatterns || {});
  const ctxImpl = new ExplicitContext();
  const logger = new HttpLogger({
    endpoint: tracerUrl,
    jsonEncoder: jsonEncoder.JSON_V2,
    httpInterval: 100,
  });
  const recorder = new BatchRecorder({
    logger,
  });
  const pageId = (window as any).MashroomPortalPageId;
  const tracer = new Tracer({
    recorder,
    ctxImpl,
    localServiceName: pageId,
  });

  (window as any).__resetTrace = () => {
    tracer.setId(tracer.createRootId());
    tracer.recordServiceName(pageId);

    tracer.recordAnnotation(new Annotation.LocalOperationStart(`${pageId}-initialization`));
    tracer.recordAnnotation(new Annotation.LocalOperationStop());
  }

  (window as any).__resetTrace();

  const oldFetch = window.fetch;

  window.fetch = function(request, options) {
    let enrichedBody: any;
    if (typeof request === 'string' && request.indexOf(tracerUrl) > -1 && options && options.method === 'POST' && !!options.body) {
      const parsedBody = JSON.parse(options.body.toString());

      enrichedBody = parsedBody.map((span: any) => {
        const enrichedTags: any = {};
        if (span.tags && span.tags['http.path']) {
          const httpPath = span.tags['http.path'];
          const service = getServiceByRegexp(httpPath, serviceRegexp);

          if (service) {
            enrichedTags['__service.id'] = service;
          }
        }

        return ({
          ...span,
          tags: {
            ...span.tags,
            ...enrichedTags,
          },
          traceId: (tracer.id as any)._traceId,
          parentId: span.parentId || (tracer.id as any)._traceId,
        })
      });
    }

    return oldFetch(request, {
      ...options,
      ...enrichedBody ? { body: JSON.stringify(enrichedBody)} : {}
    });
  }

  console.log('Zipkin Wrapper initialized with url', tracerUrl);
}
