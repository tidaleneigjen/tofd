// SPA fallback for CloudFront (runtime cloudfront-js-2.0).
//
// Attached as a viewer-request function on the DEFAULT (S3) behavior only —
// never on /api/* — so API errors are never masked. Requests whose last
// path segment has no file extension are rewritten to /index.html for
// client-side routing; anything with an extension passes through, so a
// missing asset still returns a real 403/404 instead of HTML.
function handler(event) {
  var request = event.request;
  var lastSegment = request.uri.substring(request.uri.lastIndexOf("/") + 1);
  if (lastSegment.indexOf(".") === -1) {
    request.uri = "/index.html";
  }
  return request;
}
