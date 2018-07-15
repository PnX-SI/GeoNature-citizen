# from flask_restful import Resource, reqparse
from .models import SightModel
from flask_restful import Resource

# parser = reqparse.RequestParser()
# parser.add_argument('cd_ref', help='cd_ref obligatoire', required=True)
# parser.add_argument('date', help='Date', type=lambda x: datetime.strptime(x,'%Y-%m-%d'))
# parser.add_argument('time', help='heure')
# parser.add_argument('count', help='effectif, champ obligatoire', required=True)


class SightAdd(Resource):
    """
        Création des observations
    """
    # @jwt_required
    def post(self):
        # data = parser.parse_args()
        # if not SightModel.find_by_cd_ref(data['cd_ref']):
        #     return {'message': 'Ce taxon n\'est pas ouvert à la saisie'.format(data['cd_ref'])}
        new_sight = SightModel(
            cd_ref=data['cd_ref'],
            date=data['date'],
            time=data['time'],
            count=data['count']
        )
        new_sight.save_to_db()
        # try:
        #     new_sight.save_to_db()
        #     return {
        #         'message': 'L\'observation de a été créée'.format(data['cd_ref'])
        #     }
        # except:
        #     return {'message': 'Quelque chose s\'est mal déroulé'}, 500


class AllSights(Resource):
    def get(self):
        return SightModel.return_all()

    def delete(self):
        return SightModel.delete_all()
