import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id

      const response = await api.get(`/foods/${routeParams.id}`);

      const food = response.data;

      food.formattedPrice = formatValue(food.price);

      const formatExtras = food.extras.map(extra => {
        return {
          ...extra,
          formattedValue: formatValue(extra.value),
          quantity: 0,
        };
      });

      setExtras(formatExtras);
      setFood(food);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    // setExtras([...extras, {}])

    const newExtras = [...extras];
    const findExtraIndex = newExtras.findIndex(extra => extra.id === id);

    newExtras[findExtraIndex].quantity += 1;

    setExtras(newExtras);
  }

  function handleDecrementExtra(id: number): void {
    const newExtras = [...extras];
    const findExtraIndex = newExtras.findIndex(extra => extra.id === id);

    if (!newExtras[findExtraIndex].quantity) return;

    newExtras[findExtraIndex].quantity -= 1;

    setExtras(newExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    // const newQuantity = foodQuantity + 1;
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity === 1) return;
    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not

    async function addToFavorite() {
      const getFavorites = await api.get('/favorites');

      const favoritesData = getFavorites.data;

      const checkIfFoodIsFavorited = favoritesData.findIndex(
        foodFiltered => foodFiltered.id === routeParams.id,
      );

      if (checkIfFoodIsFavorited === 0) {
        await api.delete(`/favorites/${routeParams.id}`);
        return;
      }

      const favoritedFood = food;
      delete favoritedFood.extras;

      await api.post('/favorites', favoritedFood);

      setIsFavorite(!isFavorite);
    }

    addToFavorite();
  }, [isFavorite, food, routeParams.id]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalExtras = extras.reduce((accumulator, extra) => {
      const total = extra.quantity * extra.value;
      return accumulator + total;
    }, 0);

    const totalFood = food.price * foodQuantity;

    return formatValue(totalExtras + totalFood);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    const orders = await api.get('/orders');

    const checkIfProductAlreadyBeenOrdered = orders.data.findIndex(
      product => product.id === food.id,
    );

    if (checkIfProductAlreadyBeenOrdered === 0) {
      navigation.navigate('Orders');
    }

    await api.post('/orders', food);

    navigation.navigate('Orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>
                {extra.name} {extra.formattedValue}
              </AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
