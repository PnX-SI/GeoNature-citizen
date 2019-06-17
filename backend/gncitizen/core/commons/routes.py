#!/usr/bin/python3
# -*- coding:utf-8 -*-

import json
import urllib.parse
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_optional, get_jwt_identity
from flask_admin.form import SecureForm
from flask_admin.contrib.sqla import ModelView
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import MultiPolygon, asShape

from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import json_resp
from gncitizen.utils.env import admin
from server import db

from .models import ModulesModel, ProgramsModel
from gncitizen.core.users.models import UserModel

try:
    from flask import _app_ctx_stack as ctx_stack
except ImportError:  # pragma: no cover
    from flask import _request_ctx_stack as ctx_stack
from flask_jwt_extended.utils import (
    decode_token,
    has_user_loader,
    user_loader,
    verify_token_not_blacklisted,
)
from flask_jwt_extended.exceptions import UserLoadError


routes = Blueprint("commons", __name__)


class ProgramView(ModelView):
    form_base_class = SecureForm

    def is_accessible(self):
        try:

            token = request.args.get("jwt")
            if not token:
                token = urllib.parse.parse_qsl(request.args.get("url"))[0][1]
            decoded_token = decode_token(token)
            verify_token_not_blacklisted(decoded_token, request_type="access")
            ctx_stack.top.jwt = decoded_token
            if has_user_loader():
                user = user_loader(ctx_stack.top.jwt["identity"])
                if user is None:
                    raise UserLoadError("user_loader returned None for {}".format(user))
                else:
                    ctx_stack.top.jwt_user = user

            current_user = get_jwt_identity()
            is_admin = UserModel.query.filter_by(username=current_user).one().admin
            return current_user and is_admin
        except Exception as e:
            current_app.logger.critical("FAULTY ADMIN UI ACCESS: %s", str(e))
            return False


# response.headers['Content-Security-Policy'] = "frame-ancestors 'self' '\*.somesite.com' current_app.config['URL_APPLICATION']"
# response.headers['X-Frame-Options'] = 'SAMEORIGIN' # ALLOW-FROM
admin.add_view(ProgramView(ProgramsModel, db.session))


@routes.route("/modules/<int:pk>", methods=["GET"])
@json_resp
def get_module(pk):
    """Get a module by id
         ---
         tags:
          - Modules
         parameters:
          - name: pk
            in: path
            type: integer
            required: true
            example: 1
         responses:
           200:
             description: A module description
    """
    try:
        datas = ModulesModel.query.filter_by(id_module=pk).first()
        return datas.as_dict(), 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/modules", methods=["GET"])
@json_resp
def get_modules():
    """Get all modules
        ---
        tags:
          - Modules
        responses:
          200:
            description: A list of all programs
    """
    try:
        modules = ModulesModel.query.all()
        count = len(modules)
        datas = []
        for m in modules:
            d = m.as_dict()
            datas.append(d)
        return {"count": count, "datas": datas}, 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/programs/<int:pk>", methods=["GET"])
@json_resp
def get_program(pk):
    """Get an observation by id
         ---
         tags:
          - Programs
         parameters:
          - name: pk
            in: path
            type: integer
            required: true
            example: 1
         responses:
           200:
             description: A list of all programs
         """
    try:
        datas = ProgramsModel.query.filter_by(id_program=pk, is_active=True).limit(1)
        features = []
        for data in datas:
            feature = data.get_geofeature()
            # for k, v in data:
            #     feature['properties'][k] = v
            features.append(feature)
        return {"features": features}, 200
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/programs", methods=["GET"])
@json_resp
def get_programs():
    """Get all programs
        ---
        tags:
          - Programs
        parameters:
          - name: with_geom
            in: query
            type: boolean
            description: geom desired (true) or not (false, default)
        responses:
          200:
            description: A list of all programs
    """
    try:
        # get whith_geom argument from url (?with_geom=true)
        arg_with_geom = request.args.get("with_geom")
        if arg_with_geom:
            with_geom = json.loads(arg_with_geom.lower())
        else:
            with_geom = False
        programs = ProgramsModel.query.filter_by(is_active=True).all()
        count = len(programs)
        features = []
        for program in programs:
            if with_geom:
                feature = program.get_geofeature()
            else:
                feature = {}
            feature["properties"] = program.as_dict(True)
            features.append(feature)
        feature_collection = FeatureCollection(features)
        feature_collection["count"] = count
        return feature_collection
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/programs", methods=["POST"])
@json_resp
@jwt_optional
def post_program():
    """Post a program
    add a program to database
        ---
        tags:
          - Programs
        summary: Creates a new program (JWT auth required)
        consumes:
          - application/json
        produces:
          - application/json
        parameters:
          - name: body
            in: body
            description: JSON parameters.
            required: true
            schema:
              id: Program
              required:
                - title
                - short_desc
                - long_desc
                - module
              properties:
                title:
                  type: string
                  description: Titre
                  example: Mon premier programme
                short_desc:
                  type: string
                  default:  none
                  description: Description courte (< 200 caractères)
                  required: true
                  example: Premier programme de GeoNature-citizen
                long_desc:
                  type: string
                  description: Description longue et formatée (html)
                  default:  none
                  example: "<h1> Long Description</h1> <p>jkll kjlk jlkj lkj lkjl j</p>"
                module:
                  type: integer
                  description: module associé (observations par défaut)
                  required: true
                  example: 1
                  default: 1
                geometry:
                  type: string
                  description: Geometry (GeoJson format)
                  example: {"type":"MultiPolygon","coordinates":[[[[4.95011308535733,45.0390394629218],[4.95012774926563,45.0449295197412],[4.95213300654567,45.0470559724217],[4.94818959208552,45.0498360160783],[4.94959107838521,45.0528647341048],[4.94613379711984,45.0524658617567],[4.94223384716856,45.0557853235726],[4.94070251187581,45.0684212799123],[4.93356436550241,45.0696622178299],[4.93751735253846,45.0814102522522],[4.9356315885774,45.087531523579],[4.93717248590092,45.0934761737063],[4.94681411006441,45.1001442744088],[4.95281174113414,45.1091091591692],[4.95869542090154,45.1056914521367],[4.96065478071604,45.1082509603287],[4.97080808349588,45.1076305993364],[4.98480525693456,45.102437520157],[4.99341347580405,45.1031035389658],[4.99808759644944,45.1054246923432],[5.00092421908124,45.1047253177017],[5.0045486107792,45.1008142602692],[5.00709088715848,45.104677507704],[5.0180379798632,45.1119826548125],[5.03104379372745,45.1156465107392],[5.03661054672007,45.1155089388635],[5.04537021415107,45.1244096813295],[5.04706655059779,45.1238291235659],[5.05584574495711,45.1279910207948],[5.06336763678235,45.1283925305999],[5.06869622533834,45.1310680128585],[5.07365419172495,45.1388301868816],[5.07999876794354,45.1427743015072],[5.07786342433626,45.1459305887331],[5.07055416483018,45.1465258596015],[5.06964232152214,45.1493980570617],[5.06025867953794,45.1569215891027],[5.05547971596628,45.1585139252094],[5.05176873268989,45.1552225588093],[5.04756695617908,45.1565877672145],[5.04431724602707,45.1644925692554],[5.04089085192047,45.1661945845073],[5.04386532899611,45.1810199745064],[5.04933936274465,45.1823427467976],[5.05102620061224,45.1842302996503],[5.05563122978815,45.1820018787664],[5.06485456906333,45.1820658362641],[5.06833004883646,45.1868383888935],[5.07379945760164,45.1893760533553],[5.07569119937242,45.1957180602901],[5.05802940191996,45.2049081418594],[5.05675626359527,45.2090839465506],[5.04743286723077,45.2123177236168],[5.04249503389214,45.2170198395818],[5.04506160540422,45.2175043052525],[5.04835150577254,45.2224160324905],[5.05038242155581,45.2291252278791],[5.05530600320449,45.230944306372],[5.05710468076905,45.2340907850544],[5.06914961548774,45.2367867546052],[5.07466099643677,45.2362071659723],[5.08298237168288,45.2289455127812],[5.08794182999759,45.2180710885453],[5.09294038769495,45.2198420705493],[5.09336579920924,45.2237072821965],[5.10117831453134,45.2270735050436],[5.10176092806738,45.2340793455594],[5.10880292723782,45.2385945130566],[5.10895424532246,45.2405733037282],[5.11964567240535,45.2431092934839],[5.12297225619446,45.2460906914165],[5.12760879707125,45.2469663223909],[5.13144806545964,45.2433261677798],[5.13660795731605,45.2445517427852],[5.14136787363286,45.242992395456],[5.1416388251409,45.247391916997],[5.14479725407106,45.2479528698042],[5.15310224581174,45.256305395347],[5.1558790822872,45.2545674373686],[5.16043429191985,45.2549568862231],[5.15660987500625,45.2510403530431],[5.15668551088512,45.247390795469],[5.16102270585508,45.2461179988123],[5.17654087698441,45.2484020449113],[5.18278996227186,45.2415784169858],[5.18457623195412,45.2311936470833],[5.19014655239323,45.226634775023],[5.19083374182881,45.2240090639432],[5.20020765687963,45.2202667700037],[5.20171318967148,45.2173996682677],[5.18333302980776,45.2176703892727],[5.17786114585021,45.216579197969],[5.16741518360163,45.2101347721251],[5.16830338931039,45.208397077383],[5.16472478267799,45.2005668463021],[5.16656871850906,45.2004770379442],[5.16422191440303,45.1977842451736],[5.16876107747624,45.1985338759003],[5.17548555169683,45.1808202387956],[5.18961377581572,45.1705185182698],[5.18715196717163,45.1671619236075],[5.19025705826227,45.1628944790427],[5.19170053071256,45.1545791620435],[5.18979927498971,45.1521934598712],[5.18124320717912,45.1488931706186],[5.18767141108609,45.1453174089338],[5.18808752188842,45.1419674511635],[5.19100031469761,45.1399736537568],[5.18653992236592,45.1349449088754],[5.18849497110581,45.1267007205165],[5.18743813082219,45.1208305558507],[5.18314983283291,45.1175548137929],[5.17286179586614,45.1035871134681],[5.16289429760852,45.0984305870661],[5.15781190291416,45.0893236009275],[5.15833063773881,45.0843144937],[5.15487314397137,45.0797156282626],[5.14484841481812,45.081530357532],[5.14097807452814,45.0764076084662],[5.13759836680931,45.0814444957027],[5.13454304219611,45.0746755900072],[5.13902828936142,45.0726259924146],[5.14856095639905,45.0769011542207],[5.14889777213862,45.0744176610734],[5.15679047477638,45.0658073178223],[5.16264058734893,45.0655677952186],[5.17031694666971,45.0681747376366],[5.17300029929547,45.0763911578227],[5.17938465768597,45.0833102200943],[5.18333653512374,45.084881210161],[5.19355577399695,45.0835005397074],[5.20820566986281,45.0842200206837],[5.22612330271311,45.0791795962095],[5.22749441889871,45.0772155771411],[5.22565665899745,45.0735231959789],[5.23562639774014,45.0669282376067],[5.23715721052478,45.0518099333837],[5.23030540448993,45.0367608064811],[5.23058306799345,45.0281081209971],[5.2220780309375,45.001039993189],[5.22691639569865,45.0001145884815],[5.226894042366,44.9934856486068],[5.22364374509023,44.9851558662931],[5.20892376489755,44.9710646253918],[5.20667934881251,44.960147451182],[5.19453778776847,44.940364978686],[5.18683779361078,44.920151871963],[5.17944855684884,44.9166042035759],[5.1686834319402,44.9194809042976],[5.16013674430449,44.9184314608507],[5.15003495696524,44.9111967376626],[5.14593160249067,44.9049893081196],[5.14857417905612,44.9005248830011],[5.15204094776685,44.8987284581497],[5.15094553083893,44.8946155497301],[5.14271798648966,44.8905323965831],[5.13325022964874,44.8911199703582],[5.13591001472426,44.8887631195134],[5.14579970675824,44.8902747447576],[5.16124573794876,44.8873362184647],[5.15360596742221,44.878423819644],[5.1504402779308,44.8701899623236],[5.14565569893684,44.8666258132252],[5.14577328061453,44.8567792193995],[5.14083358996452,44.8431304637043],[5.13707376047591,44.8388077136138],[5.1352458611125,44.8310161811302],[5.10513972510039,44.8260705758419],[5.10214664970183,44.826577658668],[5.09800310139488,44.8301686187737],[5.08882444372737,44.8314586185258],[5.07846636684274,44.8303021988801],[5.07346574954468,44.8316386554624],[5.07582609900681,44.8037198468329],[5.0704281404497,44.7924908655173],[5.0506124160193,44.7932824447922],[5.04125255381155,44.7984986340404],[5.01734776475004,44.8066634046818],[5.01305029927326,44.8095964458749],[5.01166256121674,44.7902674921801],[5.0069214262491,44.7888944381386],[5.00037206477324,44.7811235228854],[4.99257590289959,44.784857337902],[4.98429856553397,44.7792870169617],[4.97462229748805,44.7777576960561],[4.96956039040425,44.779081570672],[4.95976011934109,44.7761572505552],[4.95278955009484,44.7716782848881],[4.94631833497131,44.7779431125554],[4.95566407508391,44.7892611347139],[4.96095326950928,44.7929682109336],[4.95242253961387,44.8058981966876],[4.95460663924081,44.8094080746354],[4.95401895756149,44.8132459730087],[4.95240785486136,44.8113020365225],[4.94824196686328,44.8155810847149],[4.94202812446175,44.8181036578891],[4.93321078969455,44.8185278648161],[4.92364488975878,44.8148306390719],[4.92285438566429,44.8157629490509],[4.9024651541033,44.811476538669],[4.89670073253759,44.8011195283103],[4.89294276236153,44.8037143697859],[4.89007912589346,44.803195851475],[4.88370083246239,44.8091491283895],[4.88384786984447,44.8108937527577],[4.87799089353244,44.8112902751527],[4.87274253671441,44.8143869460894],[4.86811006703501,44.8211833676286],[4.86194928075535,44.8254296018837],[4.85625664571251,44.8090174984433],[4.85097635618403,44.8096370884021],[4.85064947248167,44.8066256381345],[4.83284927882366,44.8131801789493],[4.82723507781334,44.810553111044],[4.8223503792233,44.810120160829],[4.81910687191008,44.8115332566877],[4.80098960119933,44.8059843251289],[4.79907426304527,44.8109594623482],[4.79984692586181,44.8129641726745],[4.80448725265381,44.8124835223006],[4.81057623206212,44.8161306185757],[4.8135905522056,44.8154419744158],[4.82251308092393,44.817087844678],[4.81991312062405,44.8333046953117],[4.82085299030274,44.8377020631303],[4.82627691437617,44.8402425919144],[4.84001360808841,44.8418798499918],[4.84437716331824,44.846013107264],[4.84476658440316,44.8582545261278],[4.8612470587789,44.8749014638387],[4.86061816353658,44.8807658518417],[4.8547342299931,44.8897711463414],[4.85509992795196,44.9000678478834],[4.86883063304508,44.9098073471605],[4.87379338011717,44.9221701316786],[4.88658929984345,44.9366516305336],[4.87568416232782,44.9552087321462],[4.86017017535819,44.9658624557115],[4.85317038876744,44.9786149568729],[4.85543452566304,44.9783970889983],[4.85862258135809,44.9830811209621],[4.86447944606759,44.9863334227971],[4.87308523978914,44.9977619019761],[4.88255745792513,44.998601744656],[4.88719263583906,45.0058183489746],[4.90540164251165,45.0070481574135],[4.90954698285881,45.0146865895326],[4.91267301018215,45.0162450643106],[4.92669858969933,45.0134993657835],[4.9391772821066,45.0174526564036],[4.94593688838917,45.023783362203],[4.93478848225878,45.0267787114297],[4.93222920887492,45.032109985756],[4.93621846444971,45.0350758833101],[4.95011308535733,45.0390394629218]]]]}
        responses:
          200:
            description: Adding a program
        """
    try:
        request_datas = dict(request.get_json())

        # if request.files:
        #     file = request.files['file']
        #     file.save()
        # else:
        #     file = None

        datas2db = {}
        for field in request_datas:
            if hasattr(ProgramsModel, field):
                datas2db[field] = request_datas[field]

        try:
            newprogram = ProgramsModel(**datas2db)
        except Exception as e:
            print(e)
            raise GeonatureApiError(e)

        try:
            shape = asShape(request_datas["geometry"])
            newprogram.geom = from_shape(MultiPolygon(shape), srid=4326)
        except Exception as e:
            print(e)
            raise GeonatureApiError(e)

        db.session.add(newprogram)
        db.session.commit()
        # Réponse en retour
        return (
            {"message": "Nouveau programme créé.", "features": newprogram.as_dict()},
            200,
        )
    except Exception as e:
        return {"message": str(e)}, 400
