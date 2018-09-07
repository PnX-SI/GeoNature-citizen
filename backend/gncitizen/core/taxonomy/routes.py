# @routes.route('/species/')
# @jwt_optional
# def get_species():
#     species = SpecieModel.query.all()
#     # Serialize the queryset
#     result = species_schema.dump(species)
#     return jsonify({'species': result})
#
#
# @routes.route('/species/<int:pk>')
# @jwt_optional
# def get_specie(pk):
#     try:
#         specie = SpecieModel.query.get(pk)
#     except IntegrityError:
#         return jsonify({'message': 'Specie could not be found.'}), 400
#     specie_result = specie_schema.dump(specie)
#     sights_result = sights_schema.dump(specie.sights.all())
#     return jsonify({'specie': specie_result, 'quotes': sights_result})
