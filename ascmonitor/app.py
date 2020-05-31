""" Flask Web app """

from itertools import takewhile

from pymongo import MongoClient
from flask import (
    Flask,
    Response,
    abort,
    request,
    jsonify,
    redirect,
    render_template,
    send_from_directory,
    url_for,
)
from flask import json
from flask_cors import CORS

from ascmonitor.config import (
    mendeley_authinfo,
    mendeley_group_id,
    mongo_config,
    mongo_db,
    channel_auths,
    post_secret_token,
    development,
)
from ascmonitor.document_store import DocumentStore
from ascmonitor.event_store import EventStore
from ascmonitor.mendeleur import MendeleyAuthInfo
from ascmonitor.poster import Poster

static_folder = "../client/dist"
template_folder = static_folder
app = Flask(__name__, static_folder=static_folder, template_folder=template_folder)
CORS(app)

if development:
    app.logger.info("Environment: development")
else:
    app.logger.info("Environment: production")


authinfo = MendeleyAuthInfo(**mendeley_authinfo)
mongo = MongoClient(**mongo_config)[mongo_db]
event_store = EventStore(mongo)
document_store = DocumentStore(
    authinfo=authinfo, group_id=mendeley_group_id, mongo=mongo, event_store=event_store
)
poster = Poster(event_store=event_store, document_store=document_store, auths=channel_auths)


@app.route("/documents.json")
def documents():
    """ Return documents as JSON """
    return jsonify(document_store.documents)


@app.route("/documents/<id_>")
def document_by_id(id_):
    """ Return single document as json """
    return jsonify(document_store.get_by_id(id_))


@app.route("/documents/<id_>/download")
def download(id_):
    """ Download a attached PDF document """
    download_url = document_store.get_download_url(id_)
    return redirect(download_url, code=301)


@app.route("/update")
def update():
    """ Update bibliography """
    document_store.update()
    return Response("success", mimetype="text/plain")


@app.route("/queue")
def queue():
    """ Show current post queue """
    n_visible = 20
    docs = list(poster.queue)
    visible, hidden = docs[:n_visible], docs[n_visible:]
    entries = "\n".join(d["title"] for d in visible)
    rest = f"\n ... and {len(hidden)} more ..."
    return Response(entries + rest, mimetype="text/plain")


@app.route("/post/<channel>")
def post(channel):
    """
    Send out posts about new papers.
    Must be secure endpoint.
    """
    if post_secret_token:
        token = request.args.get("token")
        if token != post_secret_token:
            abort(404)

    response = poster.post(channel)
    return jsonify(response)


@app.route("/<slug>")
def publication(slug):
    """
    Provides static link to document.
    Includes meta tags.
    """
    document = document_store.get_by_slug(slug)
    if document is None:
        abort(404)

    # shorten abstract
    abstract = document["abstract"]
    if len(abstract) > 240:
        paragraphs = abstract.split("\n")
        abstract = ""
        for par in paragraphs:
            abstract += "\n" + par
            if len(abstract) > 240:
                break

    # build url
    if development:
        url = "https://asc-studymonitor.mind-foundation.org" + url_for("publication", slug=slug)
    else:
        url = url_for("publication", slug=slug)

    return render_template(
        "index.html",
        static=False,
        abstract=abstract,
        title=document["title"],
        url=url_for("publication", slug=slug),
        initial_publication=json.dumps(document),
    )


@app.route("/")
def index():
    """ Show the table as HTML """
    return render_template("index.html", static=True)


if development:

    @app.route("/js/<path:path>")
    def send_asset(path):
        """ Send static js in development """
        return send_from_directory(static_folder, "path")
